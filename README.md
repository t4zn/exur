# Exur - Online Code Compiler

A minimal, modern online code compiler built with Next.js that supports C, C++, Java, and Python. Features a clean black-and-white design with Monaco Editor and Judge0 API integration.

## Features

- **Multi-language support**: C, C++, Java, Python
- **Monaco Editor**: Professional code editor with syntax highlighting
- **Dark/Light mode**: Clean black-and-white theme
- **Real-time execution**: Powered by Judge0 API
- **Stdin support**: Input handling for interactive programs
- **Error handling**: Clear display of compilation and runtime errors
- **Responsive design**: Works on desktop and mobile
- **No backend required**: Fully static, deployable on Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Judge0 API key (free from RapidAPI)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd exur
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Get your Judge0 API key:
   - Go to [RapidAPI Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce/)
   - Subscribe to the free plan
   - Copy your API key to `.env.local`:
   ```
   NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key_here
   ```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Select Language**: Choose from C, C++, Java, or Python using the dropdown
2. **Write Code**: Use the Monaco editor with syntax highlighting
3. **Add Input**: Use the stdin textarea for programs requiring user input
4. **Run Code**: Click the "Run" button to execute your code
5. **View Output**: See results, errors, or compilation messages in the output pane
6. **Toggle Theme**: Switch between light and dark modes

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Main compiler page
│   └── globals.css         # Global styles
├── components/
│   ├── Editor.tsx          # Monaco editor wrapper
│   ├── Output.tsx          # Output display component
│   ├── LanguageSelector.tsx # Language dropdown
│   └── ThemeProvider.tsx   # Theme context and provider
└── hooks/
    └── useJudge0.ts        # Judge0 API integration hook
```

## Supported Languages

| Language | Judge0 ID | File Extension |
|----------|-----------|----------------|
| Python   | 71        | .py            |
| C        | 50        | .c             |
| C++      | 54        | .cpp           |
| Java     | 62        | .java          |

## API Integration

The app uses the Judge0 CE API for code execution:
- Submits code with language ID and optional stdin
- Polls for execution results
- Handles stdout, stderr, and compilation errors
- Supports base64 encoding for proper character handling

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `NEXT_PUBLIC_RAPIDAPI_KEY` environment variable in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app is fully static and can be deployed on any platform supporting Next.js static exports:
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- [Judge0 CE](https://github.com/judge0/judge0) for the code execution API
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
