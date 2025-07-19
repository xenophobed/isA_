# Main App Architecture

A standalone AI-powered application with multi-app capabilities and session management.

## 📁 Project Structure

```
apps/main_app/
├── components/                    # UI Components
│   ├── ui/                       # Core UI Components (standalone)
│   │   ├── chat/                 # Chat-related components
│   │   │   ├── ChatLayout.tsx           # Main chat layout
│   │   │   └── ChatContentLayout.tsx   # Message display area
│   │   ├── input/                # Input-related components
│   │   │   ├── InputAreaLayout.tsx      # Input area with controls
│   │   │   └── FileUpload.tsx           # File upload component
│   │   ├── modules/              # Functional modules
│   │   │   ├── ConversationStreamModule.tsx  # Message rendering
│   │   │   └── ChatInputModule.tsx            # Text input handling
│   │   └── session/              # Session-related components
│   │       └── SessionHistory.tsx       # Session history display
│   ├── managers/                 # Business Logic Managers
│   │   ├── AppTriggerManager.tsx        # App trigger detection
│   │   ├── ArtifactManager.tsx          # Artifact creation/management
│   │   ├── SidebarManager.tsx           # Sidebar routing
│   │   └── SessionManager.tsx           # Session lifecycle management
│   └── dashboard/                # Dashboard Components
│       └── LoggingDashboard.tsx         # Debug/logging interface
├── integrations/                 # Integration Layer
│   └── AppIntegration.ts                # Connects modules with UI/state
├── modules/                      # App Business Logic
│   ├── SimpleChatModule.ts              # Chat functionality
│   ├── DreamAppModule.ts               # Image generation logic
│   ├── HuntAppModule.ts                # Product search logic
│   └── OmniAppModule.ts                # Content generation logic
├── providers/                    # React Context Providers
│   ├── SimpleAIProvider.tsx            # AI client provider
│   └── SimpleChatProvider.tsx          # Chat state provider
├── services/                     # External Service Layer
│   ├── SimpleAIClient.ts               # AI backend client
│   └── ApiService.ts                   # HTTP client with retry/error handling
├── sidebars/                     # App-specific Sidebar Components
│   ├── dream_sidebar.tsx               # Dream app UI
│   ├── hunt_sidebar.tsx                # Hunt app UI
│   ├── omni_sidebar.tsx                # Omni app UI
│   ├── assistant_sidebar.tsx           # Assistant app UI
│   ├── digitalhub_sidebar.tsx          # Digital hub app UI
│   ├── data_scientist_sidebar.tsx      # Data scientist app UI
│   └── doc_sidebar.tsx                 # Document app UI
├── stores/                       # State Management
│   └── useAppStore.ts                  # Zustand store for global state
├── types/                        # TypeScript Definitions
│   └── app_types.ts                    # App-specific types
├── utils/                        # Utility Functions
│   ├── logger.ts                       # Logging system
│   └── sidebar_helper.ts               # Sidebar utilities
├── hooks/                        # Custom React Hooks
│   └── use_app_state.ts                # Legacy state hook (deprecated)
├── main_app.tsx                  # Main application component
└── page.tsx                      # App entry point
```

## 🧩 Component Categories

### **UI Components** (`components/ui/`)
- **Pure UI components** with minimal business logic
- **Standalone** - no SDK dependencies
- **Reusable** across different contexts
- Handle presentation and user interaction

### **Managers** (`components/managers/`)
- **Business logic coordinators**
- Handle complex workflows and orchestration
- Connect multiple systems/services
- Manage component interactions

### **Dashboard** (`components/dashboard/`)
- **Developer/admin tools**
- Debugging interfaces
- Performance monitoring
- System introspection

## 🔄 Data Flow

```
User Input → ChatInputModule → SimpleAIClient → AI Backend
     ↓                                              ↓
SessionManager ← AppIntegration ← AppModules ← AI Response
     ↓                    ↓
AppStore (Zustand) → SidebarManager → App Sidebars
     ↓
ArtifactManager → UI Components
```

## 🚀 Key Features

### **Multi-App System**
- **Dream**: AI image generation with style controls
- **Hunt**: Product search and comparison
- **Omni**: Multi-format content generation
- **Assistant**: General AI assistance
- **DigitalHub**: File organization
- **DataScientist**: Data analysis
- **Doc**: Document processing

### **Session Management**
- Persistent chat sessions with localStorage
- Session metadata tracking (apps used, message count)
- Session switching and management
- Automatic session creation

### **Artifact System**
- Generated content preservation
- App-specific artifact types (images, text, data)
- Artifact reopening and sharing
- Visual artifact display

### **State Management**
- **Zustand** for global application state
- App-specific state slices
- Persistent state where needed
- Reactive UI updates

## 🛠 Development Guidelines

### **Adding New Apps**
1. Create module in `modules/[AppName]Module.ts`
2. Create sidebar in `sidebars/[app_name]_sidebar.tsx`
3. Add to `AppIntegration.ts`
4. Update `SidebarManager.tsx`
5. Add to `useAppStore.ts` state

### **Adding UI Components**
- Place in appropriate `ui/` subdirectory
- Keep components standalone (no SDK deps)
- Use TypeScript interfaces for props
- Include proper error handling

### **State Updates**
- Use Zustand store for global state
- Use local state for component-specific data
- Prefer actions over direct state mutation
- Include logging for important state changes

## 📦 Dependencies

### **Core**
- React 18+
- TypeScript
- Zustand (state management)
- Tailwind CSS (styling)

### **Internal**
- Custom AI client (`SimpleAIClient`)
- Custom logging system
- Custom integration layer

### **No External SDK Dependencies**
- Completely standalone
- No reliance on external AI SDKs
- Custom-built for flexibility and control

## 🔧 Usage

```tsx
// Main app usage
import { MainApp } from './main_app';

function App() {
  return <MainApp />;
}

// Using individual components
import { SessionManager } from './components/managers/SessionManager';
import { DreamAppModule } from './modules/DreamAppModule';

// Access global state
import { useAppStore } from './stores/useAppStore';
const { currentApp, setCurrentApp } = useAppStore();
```

This architecture provides a robust, scalable foundation for building AI-powered applications with multiple specialized tools and comprehensive session management.