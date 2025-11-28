# 3101-project-4-petri-dish

A collaborative, real-time web application for simulating mold growth in a petri dish. 2 users can work togetherto create this simulation! One is the controlling environmental conditions while the other places and observe different types of mold cultures. Both are able to see the final result

Features
-----------
*   **Real-time Collaboration**: 2 users can connect and interact with the same petri dish simultaneously
*   **Dual Role System**:
    *   **Environment Controller**: adjust the environment, time, and temperature parameters      
    *   **Mold Placer**: select and place different mold types in the dish    
*   **6 Unique Mold Types**: each with distinct visual appearance
*   **Dynamic Mold Growth**: size affected by environmental parameters (environment, time, temperature)
*   **Live State Synchronization**: all users see the same petri dish state in real-time
*   **Visual Feedback**: see how environmental changes affect future mold placement

getting started!
------------------
### Prerequisites
*   Node.js (v14 or higher)
*   npm or yarn
### Installation
**Clone the repository**

`git clone      cd mold-culture-simulator`

**Install dependencies**
    
 `npm install`

**Start the WebSocket server**
    
 `node server.js`

The server will start on http://localhost:3000

**Start the React development server** (in a separate terminal)

`npm run dev`

The client will typically start on http://localhost:5173

**Open multiple browser tabs/windows** to test collaboration features
    
How to Use
-------------

### 1\. Connect to the Application

Open the application in your browser. You'll see your assigned ID and a list of connected users.

### 2\. Choose Your Role

**Environment Controller**

*   Control three environmental parameters:
    *   **Environment Parameters**: Affects base mold size (10-40px range)
    *   **Time (Growth Factor)**: Affects how much molds grow (1x-3x multiplier)
    *   **Temperature**: Affects temperature effect on growth (0.5x-1.5x multiplier)
*   See real-time preview of resulting mold size
*   Changes instantly affect all connected users

**Mold Placer**
*   Select from 6 different mold types
*   Click anywhere inside the petri dish to place mold
*   See current environmental settings and resulting mold size
*   Clear the entire dish with the "clear petri dish" button

### 3\. Collaborate
*   Multiple controllers can adjust parameters
*   Place the molds to the same dish   
*   All users see the same state in real-time!


Technical Details
--------------------

### Backend
*   **Server**: Express.js with express-ws for WebSocket support
*   **Port**: 3000
*   **Protocol**: WebSocket with JSON messaging
*   **State Management**: Server maintains authoritative state for environment parameters and mold positions

### Frontend
*   **Framework**: React with Hooks  
*   **Canvas**: HTML5 Canvas for rendering petri dish and molds   
*   **State Management**: React useState with WebSocket event handlers
*   **Styling**: CSS with custom styling for a unique aesthetic

### WebSocket Events

See protocol.md for a more detailed documentation of all message types and data structures.

Key events:

*   welcome - Initial connection with client ID
*   environment\_update - Environmental parameter changes
*   mold\_placed - New mold added to dish
*   clear\_dish - All molds removed
*   connected / disconnected - User connection status  

**Note**: This is a simulation for educational and entertainment purposes. It does not accurately represent real mold biology or growth patterns! 🧪