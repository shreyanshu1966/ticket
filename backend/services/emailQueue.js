import { EventEmitter } from 'events'

class EmailQueue extends EventEmitter {
  constructor() {
    super()
    this.queue = []
    this.processing = false
    this.retryDelays = [1000, 3000, 10000, 30000] // 1s, 3s, 10s, 30s
    this.maxRetries = 4
    
    console.log('📨 Email queue initialized')
  }

  // Add email to queue
  addToQueue(emailTask) {
    const queuedTask = {
      id: Date.now() + Math.random(),
      ...emailTask,
      attempts: 0,
      createdAt: new Date()
    }
    
    this.queue.push(queuedTask)
    console.log(`📥 Email queued: ${queuedTask.id} (Queue size: ${this.queue.length})`)
    
    // Start processing if not already processing
    if (!this.processing) {
      this.processQueue()
    }
    
    return queuedTask.id
  }

  // Process queue sequentially
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    console.log(`🔄 Starting to process email queue (${this.queue.length} emails)`)

    while (this.queue.length > 0) {
      const task = this.queue.shift()
      await this.processTask(task)
      
      // Add delay between emails to respect rate limits
      await this.delay(2000) // 2 seconds between emails
    }

    this.processing = false
    console.log('✅ Email queue processing complete')
  }

  // Process individual email task
  async processTask(task) {
    console.log(`📤 Processing email ${task.id} (Attempt ${task.attempts + 1}/${this.maxRetries + 1})`)
    
    try {
      const result = await task.sendFunction(task.mailOptions)
      console.log(`✅ Email ${task.id} sent successfully`)
      
      // Emit success event
      this.emit('emailSent', { taskId: task.id, result })
      return result
      
    } catch (error) {
      task.attempts++
      console.error(`❌ Email ${task.id} failed (Attempt ${task.attempts}): ${error.message}`)

      // Check if we should retry
      if (this.shouldRetry(error, task.attempts)) {
        const retryDelay = this.retryDelays[Math.min(task.attempts - 1, this.retryDelays.length - 1)]
        console.log(`⏳ Retrying email ${task.id} in ${retryDelay}ms...`)
        
        // Add back to queue after delay
        setTimeout(() => {
          this.queue.unshift(task) // Add to front for priority
          if (!this.processing) {
            this.processQueue()
          }
        }, retryDelay)
        
      } else {
        console.error(`💀 Email ${task.id} permanently failed after ${task.attempts} attempts`)
        // Emit failure event
        this.emit('emailFailed', { taskId: task.id, error: error.message, attempts: task.attempts })
      }
    }
  }

  // Determine if email should be retried
  shouldRetry(error, attempts) {
    // Don't retry if max attempts reached
    if (attempts >= this.maxRetries) {
      return false
    }

    // Don't retry on authentication errors
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      return false
    }

    // Don't retry on permanent email errors
    if (error.responseCode >= 500 && error.responseCode < 600) {
      return true // Retry on server errors
    }

    if (error.responseCode >= 400 && error.responseCode < 500) {
      return false // Don't retry on client errors (except 421)
    }

    // Retry on connection-related errors
    if (error.code === 'ECONNECTION' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'EPROTOCOL' ||
        error.response?.includes('Too many concurrent') ||
        error.response?.includes('421')) {
      return true
    }

    // Default: retry on unknown errors
    return true
  }

  // Helper function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get queue status
  getStatus() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      totalProcessed: this.totalProcessed || 0
    }
  }

  // Clear queue (emergency)
  clearQueue() {
    const clearedCount = this.queue.length
    this.queue = []
    console.log(`🗑️ Cleared ${clearedCount} emails from queue`)
    return clearedCount
  }
}

// Create singleton instance
const emailQueue = new EmailQueue()

// Event listeners for monitoring
emailQueue.on('emailSent', (data) => {
  console.log(`📨✅ Email ${data.taskId} sent successfully`)
})

emailQueue.on('emailFailed', (data) => {
  console.error(`📨❌ Email ${data.taskId} permanently failed: ${data.error}`)
})

export default emailQueue