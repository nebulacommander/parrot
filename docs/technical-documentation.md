# parrot Voice Assistant Technical Documentation

## Overview
parrot is an advanced voice assistant application that combines real-time speech processing with AI-powered responses. The application leverages cutting-edge technologies including Groq for AI processing, Cartesia for enhancement, and Voice Activity Detection (VAD) for speech recognition.

## Technical Architecture

### Core Technologies
- Frontend: React (Next.js)
- Speech Processing: Voice Activity Detection (VAD)
- AI Processing: Deepseek AI + Groq
- Deployment: Vercel
- Analytics: Vercel Analytics

### Key Components

#### 1. Voice Activity Detection (VAD)
- Implements real-time speech detection using @ricky0123/vad-react
- Configuration parameters:
  - startOnLoad: true (automatic initialization)
  - positiveSpeechThreshold: 0.6
  - minSpeechFrames: 4
- Supports cross-browser compatibility with custom WASM configurations

#### 2. Message Handling System
```typescript
type Message = {
    role: "user" | "assistant";
    content: string;
    thinking?: string;
    latency?: number;
};
```
- Manages bidirectional communication
- Tracks message history
- Includes performance metrics (latency)
- Supports "thinking" state visualization

#### 3. API Integration
- RESTful API communication
- FormData-based request handling
- Supports both text and audio inputs
- Error handling with user-friendly notifications

### User Interface Components

#### 1. Input System
- Dual-mode input (voice and text)
- Keyboard shortcuts:
  - Enter: Focus input
  - Escape: Clear input
  - Ctrl+Z: Toggle thinking display

#### 2. Response Display
- Real-time response rendering
- Thinking state visualization
- Performance metrics display
- Accessibility-friendly design

#### 3. Visual Feedback
- Dynamic microphone activity indication
- Loading states
- Error notifications via toast messages

## Data Flow

1. User Input
   - Voice input processing:
     ```typescript
     onSpeechEnd: (audio) => {
         const wav = utils.encodeWAV(audio);
         const blob = new Blob([wav], { type: "audio/wav" });
         submit(blob);
     }
     ```
   - Text input processing through form submission

2. Server Communication
   - Request formatting with FormData
   - Message history inclusion
   - Response parsing with metadata extraction

3. Response Handling
   - Stream processing
   - Audio playback
   - UI state updates
   - Error management

## Performance Considerations

### Optimization Features
- Efficient audio encoding
- Browser-specific optimizations
- Threading configuration for different platforms
- Memory management for audio processing

### Error Handling
- Network error recovery
- Rate limiting protection
- Invalid response handling
- Browser compatibility management

## Security Measures

- Secure API communication
- Input sanitization
- Rate limiting
- Cross-browser compatibility checks

## Accessibility

- Keyboard navigation support
- Screen reader compatibility
- Visual feedback systems
- Multi-modal interaction support

## Browser Compatibility

### Supported Browsers
- Chrome
- Firefox (with specific handling)
- Safari (with threading adjustments)

### Platform-Specific Optimizations
```typescript
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
numThreads: isSafari ? 1 : 4
```

## Integration Guidelines

### Required Environment Setup
1. WASM support
2. Audio processing capabilities
3. Secure HTTPS connection
4. Modern browser environment

### API Requirements
- Endpoint: /api
- Methods: POST
- Content Types: multipart/form-data
- Response Headers:
  - X-Transcript
  - X-Response
  - X-Thinking

## Monitoring and Analytics

- User interaction tracking
- Performance metrics collection
- Error rate monitoring
- Response time tracking

## Future Considerations

1. Enhanced multi-language support
2. Improved audio processing
3. Extended API capabilities
4. Additional UI customization options

## Support and Maintenance

### Troubleshooting Guide
1. Check browser compatibility
2. Verify audio permissions
3. Confirm network connectivity
4. Validate API responses

### Common Issues
- Audio permission denials
- Network timeout handling
- Browser compatibility issues
- Performance optimization

## Version Information

- Current Version: 1.0.0
- Last Updated: [Current Date]
- Dependencies:
  - @ricky0123/vad-react
  - @vercel/analytics
  - sonner
  - clsx
