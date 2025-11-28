Mold Culture Simulator - WebSocket Protocol
===========================================

Overview
--------

This is the markdown document that describes the WebSocket communication protocol for my petri dish simulator-- a collaborative application where 2 users can control environmental parameters and place mold cultures in a shared petri dish!

Server --> Client Messages
------------------------

### welcome

sent when a client first connects--provides the client's assigned ID and current state.

`   {    "type": "welcome",    "id": 0,    "connected": [0, 1, 2],    "messages": []  }   `

**Fields:**

* id (number): the unique identifier assigned to this client
* connected (number\[\]): array of IDs for all currently connected clients  

### connected

show when a new client connects.

`   {    "type": "connected",    "id": 3  }   `

**Fields:**

* id (number): the ID of the newly connected client   

### disconnected

show when a client disconnects

`   {    "type": "disconnected",    "id": 2  }   `

**Fields:**

* id (number): the ID of the disconnected client  

### environment\_update

sent when environmental parameters change-- this affects the size of the newly placed molds.

`   {    "type": "environment_update",    "environment": 75,    "time": 60,    "temperature": 80  }   `

**Fields:**

* environment (number): environmental parameter value (0-100)-- affects base mold size (10-40px range)
* time (number): time/growth factor value (0-100)-- affects growth multiplier (1x-3x range)
* temperature (number): temperature value (0-100)-- affects temperature effect multiplier (0.5x-1.5x range)    

**Mold Size Calculation:**

`   baseSize = 10 + (environment / 100) * 30  growthFactor = 1 + (time / 100) * 2  tempEffect = 0.5 + (temperature / 100)  finalSize = baseSize * growthFactor * tempEffect   `

### mold\_placed

sent when a new mold is placed or when syncing the complete mold state

`   {    "type": "mold_placed",    "molds": [      {        "x": 150,        "y": 200,        "size": 25.5,        "type": 0      }    ]  }   `

**Fields:**

* molds (array): complete array of all molds currently in the petri dish
    * x (number): X-coordinate of mold center (canvas coordinates) 
    * y (number): Y-coordinate of mold center (canvas coordinates)
    * size (number): diameter of the mold in pixels
    * type (number): mold type index (0-5, corresponding to MOLD\_TYPES array)      

**Mold Types:**
* 0: abstract mold
* 1: double mold
* 2: mold
* 3: pink mold
* 4: speckle mold
* 5: yellow mold   

### clear\_dish

shows when the petri dish is cleared of all molds

`   {    "type": "clear_dish"  }   `

**Fields:** none

Client --> Server Messages
------------------------

### environment\_update

sent by the environment controller to update environmental parameters

`   {    "type": "environment_update",    "environment": 75,    "time": 60,    "temperature": 80  }   `

**Fields:**

* environment (number): new environment value (0-100)
* time (number): new time value (0-100)
* temperature (number): new temperature value (0-100)  

**Server Response:** broadcasts the same message to all connected clients

### mold\_placed

sent by the mold placer when adding a new mold to the dish

`   {    "type": "mold_placed",    "molds": [      {        "x": 150,        "y": 200,        "size": 25.5,        "type": 0      }    ]  }   `

**Fields:**

* molds (array): updated complete array of all molds in the petri dish

**Server Response:** broadcasts the molds array to all connected clients

### clear\_dish

sent by the mold placer to remove all molds from the petri dish

`   {    "type": "clear_dish"  }   `

**Fields:** none

**Server Response:** broadcasts clear\_dish to all connected clients

### client\_message

legacy message type for general messaging (currently unused in the mold simulator)

`   {    "type": "client_message",    "content": "Hello world"  }   `

**Fields:**

* content (string): Message content   

**Server Response:** broadcasts as server\_message with sender ID and timestamp

state synchronization
---------------------

### Initial Connection Flow

1-- Client connects to WebSocket endpoint
2-- Server assigns unique ID and sends welcome message with:
    * Client's assigned ID
    * List of connected client IDs
    * Historical messages (if any)
        
3-- Server sends current environment\_update with latest parameters
    
4-- Server sends mold\_placed with current mold state
    
5-- Server broadcasts connected message to all other clients

### Ongoing Synchronization

* All state changes are broadcast to all connected clients immediately
* The server maintains authoritative state for:
    * currentEnvironment: Current environmental parameters
    * currentMolds: Complete array of all placed molds  
* Clients should update their local state based on received messages

User Roles
----------

The application supports two distinct roles (client-side only, not enforced by server):

### Environment Controller

* Can adjust three environmental sliders (environment, time, temperature)
* Sends environment\_update messages
* Cannot place molds

### Mold Placer

* Can select mold type and click to place molds in the petri dish
* Sends mold\_placed messages when adding molds
* Sends clear\_dish message to reset the dish
* Receives environment updates from controllers   

**Note:** Role selection is purely client-side. The server accepts messages from any client regardless of intended role.

Constraints
-----------

### Petri Dish Boundaries

* Canvas size: 500x500 pixels
* Valid placement area: Circle with center (200, 200) and radius 190px
* Molds placed outside this circle are rejected client-side 

### Connection Limits

* No enforced limit on simultaneous connections
* Each client receives a unique incrementing ID starting from 0

Error Handling
--------------

The protocol currently has minimal error handling...

* Invalid JSON messages are silently ignored-- will throw and disconnect
* Unknown message types are silently ignored
* No validation of numeric ranges for environment parameters
* No validation of mold placement coordinates
