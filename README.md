
# Chat Application

A modern, responsive chat application built with React, TypeScript, Firebase, and GSAP animations.

## Project Structure

The project follows a standard industry file structure organized by feature and functionality:

### Core Directories

- **src/components**: UI components
  - **ui/**: Reusable shadcn UI components
  - **subSidebar/**: Components related to sidebar functionality
  - **calls/**: Voice and video call components
- **src/contexts**: React context providers for state management
- **src/hooks**: Custom React hooks
- **src/lib**: Utility functions, types, and configurations
- **src/pages**: Main application pages
- **src/routes**: Route-related components like PrivateRoute
- **src/services**: API and service layer

### Key Components

| Component | Purpose |
|-----------|---------|
| `MobileNav.tsx` | Mobile navigation with sidebar toggle for responsive design |
| `Sidebar.tsx` | Main application sidebar with tabs for chats, contacts, and settings |
| `ChatWindow.tsx` | Main chat interface displaying messages and input |
| `MessageList.tsx` | Displays chat messages with proper alignment and formatting |
| `ChatPreview.tsx` | Individual chat preview items in the sidebar |
| `AllUsers.tsx` | Lists all users with search functionality |
| `Chats.tsx` | Lists all chats with proper time formatting and animations |

### Context Providers

| Provider | Purpose |
|----------|---------|
| `AuthContext` | Manages user authentication state |
| `ChatContext` | Manages chat-related state and operations |
| `CallContext` | Handles voice and video call functionality |
| `ThemeContext` | Controls light/dark theme switching |

## Features

- **Real-time messaging** with Firebase Realtime Database
- **User authentication** and profile management
- **Group chats** creation and management
- **Voice and video calls**
- **Responsive design** optimized for both desktop and mobile
- **Dark and light mode** support
- **Animations and transitions** using GSAP
- **Bangladesh time format** for message timestamps (12-hour format)
- **Search functionality** for users and chats
- **Mobile-friendly navigation** with accessible sidebar

## Mobile Design Considerations

The application features several mobile-specific UI elements:

- Hamburger menu button in the top-left for opening the sidebar
- Responsive chat interface that adapts to screen size
- Bottom navigation for quick access to key features
- Slide-out sidebar with smooth animations
- Touch-friendly UI elements with appropriate sizes

## Animation System

The app uses GSAP (GreenSock Animation Platform) for smooth, sophisticated animations:

- Fade-in/fade-out transitions for UI elements
- Staggered animations for list items
- Smooth transitions for sidebar opening/closing
- Scroll animations for message lists
- Background animations for visual appeal

## Time Formatting

The chat application displays timestamps in Bangladesh time format (12-hour with AM/PM), ensuring consistency across the application.

## Search Functionality

Users can search both chats and contacts by:
- Username
- Email
- Group name (for group chats)

The search is case-insensitive and updates in real-time as the user types.

## Development Notes

- This project uses TypeScript for type safety
- Shadcn UI components for consistent design
- Firebase for authentication, database, and storage
- React Router for navigation
- GSAP for animations
- Tailwind CSS for styling
#   i - C h a t - M e s s a g i n g - P l a t f o r m -  
 