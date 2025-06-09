# RukminiChat - AI-Powered Floating Chat UI

A modern, emotion-aware chat interface for the Chanakya wellness and finance project, featuring a floating avatar that adapts to user interactions.

## Features

- 🎭 Gender-aware avatar (Rukmini/Krishna/Chanakya)
- 💬 Real-time chat with typing indicators
- 🎨 Mood-adaptive theming
- 📱 Responsive design with mobile-first approach
- 🌓 Dark/Light mode support
- 🎉 Gamification elements (Wisdom Level, XP)
- 🎤 Quick replies and voice input support
- ✨ Smooth animations and transitions

## Installation

1. Install the required dependencies:

```bash
npm install framer-motion react-icons @heroicons/react
```

## Usage

1. Wrap your application with the ChatProvider:

```tsx
import { RukminiChat } from './components/RukminiChat';

function App() {
  return (
    <div className="App">
      {/* Your app content */}
      <RukminiChat />
    </div>
  );
}
```

2. Customize the default configuration by passing props:

```tsx
<RukminiChat 
  defaultGender="female"
  userName="Alex"
  initialMood="happy"
  theme={{
    primary: '#8b5cf6',
    secondary: '#6366f1',
  }}
/>
```

## Configuration

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| defaultGender | 'male' \| 'female' \| 'neutral' | 'neutral' | Default gender for the assistant |
| userName | string | 'Friend' | User's name for personalization |
| initialMood | 'calm' \| 'happy' \| 'excited' \| 'stressed' \| 'neutral' | 'neutral' | Initial mood for the chat |
| theme | Object | See below | Custom theme colors |

### Default Theme

```ts
{
  primary: '#6366f1',
  secondary: '#8b5cf6',
  background: 'rgba(255, 255, 255, 0.1)',
  text: '#1f2937',
}
```

## Customization

### Custom Avatars

Place your avatar images in the `public/avatars/` directory:
- `krish.png` - Male assistant avatar
- `rukmini.png` - Female assistant avatar
- `chanakya.png` - Neutral avatar

### Styling

All components use Tailwind CSS for styling. You can override styles using the `className` prop or by extending the theme in your Tailwind config.

## API Integration

To connect with your AI backend, modify the `sendMessage` function in `ChatContext.tsx` to make API calls to your service.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with React, TypeScript, and Framer Motion
- Inspired by modern chat interfaces and conversational UIs
- Part of the Chanakya Wellness and Finance project
