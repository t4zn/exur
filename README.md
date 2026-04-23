# Exur - Advanced Collaborative Code Editor

A sophisticated, real-time collaborative code editor and compiler built with Next.js, featuring multi-language support, AI-powered code assistance, and seamless team collaboration capabilities.

## 🚀 Live Demo

**Production**: [https://exur.in](https://exur.in)

## ✨ Key Features

### 🔥 Core Functionality
- **30+ Programming Languages** - From Python and JavaScript to Assembly and Sanskrit
- **Real-time Code Execution** - Powered by Judge0 API with multiple fallback keys
- **Multi-file Project Support** - Tabbed interface with file management
- **Professional Monaco Editor** - Full-featured code editor with syntax highlighting
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices

### 🤝 Real-time Collaboration
- **Live Collaborative Editing** - Multiple users can code together simultaneously
- **Real-time Cursors** - See exactly where teammates are typing with colored cursors
- **Instant Chat System** - Built-in messaging with emoji reactions and threaded replies
- **Room-based Sessions** - Create or join coding rooms with 4-letter codes
- **User Presence Indicators** - Track who's online and active in each file

### 🤖 AI-Powered Features
- **Intelligent Code Fixing** - AI analyzes errors and suggests corrections
- **One-click Apply/Reject** - Review and apply AI suggestions with diff highlighting
- **Context-aware Suggestions** - Language-specific error analysis and fixes
- **Powered by Groq** - Fast, accurate AI responses for code assistance

### 🎨 Customization & Themes
- **Light/Dark Mode** - Seamless theme switching with system preference detection
- **Custom Language Creator** - Build your own programming languages with keyword mapping
- **Syntax Highlighting** - Full support for all languages including custom ones
- **Personalized Experience** - Customizable editor settings and preferences

### 📁 Advanced File Management
- **Multi-tab Interface** - Work with multiple files simultaneously
- **Smart File Naming** - Automatic extension detection and validation
- **File Operations** - Create, rename, close, copy, and download files
- **Project Organization** - Maintain clean project structure across sessions

### 🔧 Developer Experience
- **Execution Statistics** - Runtime and memory usage tracking
- **Input/Output Handling** - Support for stdin/stdout operations
- **Error Highlighting** - Clear error messages with line-specific feedback
- **Code Formatting** - Automatic indentation and syntax validation

## 🏗️ Technical Architecture

### Frontend Stack
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Modern utility-first styling
- **Monaco Editor** - VS Code's editor engine
- **Socket.IO Client** - Real-time communication

### Backend Infrastructure
- **Node.js Server** - Custom Express server with Socket.IO
- **WebSocket Architecture** - Real-time collaboration engine
- **Judge0 API Integration** - Code execution with multiple API keys
- **Groq AI Integration** - Advanced language model for code assistance

### Key Technical Features
- **Real-time Synchronization** - Operational Transform-like conflict resolution
- **Memory Management** - Efficient handling of large codebases
- **Error Recovery** - Robust error handling and fallback mechanisms
- **Performance Optimization** - Lazy loading and code splitting

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Judge0 API key (free from RapidAPI)
- Groq API key (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/exur.git
cd exur
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Environment Setup**
```bash
cp .env.example .env.local
```

4. **Configure API Keys**
```env
# Judge0 API (get from RapidAPI)
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key_here
NEXT_PUBLIC_RAPIDAPI_KEY_1=your_backup_key_1
NEXT_PUBLIC_RAPIDAPI_KEY_2=your_backup_key_2

# Groq AI API (get from Groq Console)
GROQ_API_KEY=your_groq_api_key_here

# Socket.IO Server URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

5. **Development Server**
```bash
# Start the collaborative server (includes Next.js + Socket.IO)
npm run dev:collab

# Or start standard Next.js server (single-user mode)
npm run dev
```

6. **Production Build**
```bash
npm run build
npm run start:collab
```

## 🌐 Deployment

### Render (Recommended)
1. Connect your GitHub repository to Render
2. Set build command: `npm run build`
3. Set start command: `npm run start`
4. Add environment variables in Render dashboard
5. Deploy automatically on git push

### Other Platforms
- **Vercel**: Frontend-only deployment (disable collaborative features)
- **Railway**: Full-stack deployment with WebSocket support
- **Heroku**: Complete application deployment
- **DigitalOcean**: VPS deployment with PM2

## 📊 Supported Languages

| Language | Judge0 ID | Extension | Status |
|----------|-----------|-----------|---------|
| Python | 71 | .py | ✅ Full Support |
| JavaScript | 63 | .js | ✅ Full Support |
| TypeScript | 74 | .ts | ✅ Full Support |
| Java | 62 | .java | ✅ Full Support |
| C++ | 54 | .cpp | ✅ Full Support |
| C | 50 | .c | ✅ Full Support |
| C# | 51 | .cs | ✅ Full Support |
| Go | 60 | .go | ✅ Full Support |
| Rust | 73 | .rs | ✅ Full Support |
| PHP | 68 | .php | ✅ Full Support |
| Ruby | 72 | .rb | ✅ Full Support |
| Swift | 83 | .swift | ✅ Full Support |
| Kotlin | 78 | .kt | ✅ Full Support |
| Scala | 81 | .scala | ✅ Full Support |
| R | 80 | .r | ✅ Full Support |
| Assembly | 45 | .asm | ✅ Full Support |
| Sanskrit | 85 | .ved | ✅ Custom Implementation |
| **+15 More** | - | - | ✅ See full list in app |

## 🔌 API Integration

### Judge0 Code Execution
- Multiple API key rotation for high availability
- Automatic fallback handling
- Rate limit management
- Base64 encoding for special characters

### Groq AI Integration
- Fast inference for code analysis
- Context-aware error fixing
- Language-specific suggestions
- Streaming responses for better UX

### WebSocket Architecture
```javascript
// Real-time events
- code-change: Sync code across users
- cursor-move: Share cursor positions
- chat-message: Team communication
- user-joined/left: Presence management
- file-operations: Multi-file sync
```

## 🎯 Advanced Features

### Custom Language Creation
Create your own programming languages with:
- Custom keyword mapping
- Syntax highlighting
- File extension association
- Python-based execution engine

### Collaborative Features
- **Room Management**: Create/join coding sessions
- **Live Cursors**: Real-time cursor tracking
- **Chat System**: Integrated team communication
- **File Presence**: See who's working on what
- **Conflict Resolution**: Automatic merge handling

### AI Code Assistant
- **Error Analysis**: Intelligent error detection
- **Code Suggestions**: Context-aware fixes
- **Diff Visualization**: Clear before/after comparison
- **Multi-language Support**: Works with all supported languages

## 🔧 Configuration

### Environment Variables
```env
# Required
NEXT_PUBLIC_RAPIDAPI_KEY=your_judge0_key
GROQ_API_KEY=your_groq_key

# Optional
NEXT_PUBLIC_SOCKET_URL=your_websocket_server
NODE_ENV=production
PORT=3000
```

### Custom Language Example
```javascript
// Create a custom language
const myLanguage = {
  name: "MyLang",
  extension: "mylang",
  keywords: {
    "show": "print",
    "when": "if",
    "otherwise": "else",
    "repeat": "for"
  }
};
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- TypeScript for type safety
- ESLint + Prettier for formatting
- Conventional commits
- Component-based architecture

## 📈 Performance

- **Bundle Size**: Optimized with Next.js code splitting
- **Real-time Latency**: <50ms for collaborative features
- **Code Execution**: 1-3s average response time
- **Memory Usage**: Efficient Monaco Editor integration
- **Mobile Performance**: Responsive design with touch support

## 🔒 Security

- **Input Validation**: Sanitized code execution
- **Rate Limiting**: API abuse prevention
- **CORS Configuration**: Secure cross-origin requests
- **Environment Isolation**: Sandboxed code execution

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Judge0 CE](https://github.com/judge0/judge0) - Code execution engine
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Socket.IO](https://socket.io/) - Real-time communication
- [Groq](https://groq.com/) - AI inference platform
- [Next.js](https://nextjs.org/) - React framework

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/exur/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/exur/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/exur/discussions)
- **Email**: support@exur.in

---

**Built with ❤️ by [Taizun](https://t4z.in)**

*Empowering developers to code together, anywhere, anytime.*
