# 💻 WebTerminalLinux

> **High-performance, WebSocket-free web terminal emulator powered by Node.js, Express, and Server-Sent Events (SSE).**

![Platform](https://img.shields.io/badge/Platform-Node.js-339933?logo=nodedotjs&logoColor=white)
![Framework](https://img.shields.io/badge/Framework-Express%204-000000?logo=express&logoColor=white)
![Terminal](https://img.shields.io/badge/Terminal-xterm.js%20v5-F80000?logo=gnometerminal&logoColor=white)
![Streaming](https://img.shields.io/badge/Streaming-Server--Sent%20Events%20(SSE)-007ACC)
![Security](https://img.shields.io/badge/Security-Helmet-4B32C3)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

---

## 📖 Overview

**WebTerminalLinux** provides full interactive shell access directly inside modern web browsers without relying on WebSockets. Designed specifically for environments where WebSocket connections are terminated, filtered, or blocked by corporate proxies, reverse proxies, strict firewalls, or cloud ingress controllers, it utilizes a resilient dual-channel HTTP design:

1. **Downstream (Server → Browser)**: Standard HTTP streaming via **Server-Sent Events (SSE)** transmitting real-time terminal output.
2. **Upstream (Browser → Server)**: Asynchronous **HTTP POST** requests sending keystrokes and resize signals with zero protocol overhead.

Powered by `node-pty` and `xterm.js`, WebTerminalLinux delivers genuine pseudo-terminal (PTY) emulation with full ANSI color support, cursor positioning, and dynamic window resizing.

---

## ✨ Key Features

- **WebSocket-Free Streaming Architecture**: Operates over standard HTTP/1.1 or HTTP/2 streams (`text/event-stream`), traversing any proxy or reverse proxy without custom WebSocket upgrade configurations.
- **Full Pseudo-Terminal (PTY) Spawning**: Employs `node-pty` to spawn genuine system shells (`$SHELL`, `/bin/bash`, or `powershell.exe` on Windows), offering an authentic terminal experience with full cursor addressing, TAB completion, and color formatting.
- **Automatic Process Recovery**: Listens to PTY `exit` events; if a user exits the shell (`exit` command or signal), a fresh PTY instance is immediately spawned without disrupting the active web session or requiring a server reboot.
- **Resilient Keepalive Heartbeat**: Transmits periodic heartbeat comments (`:hb\n\n`) every 25 seconds across active SSE connections, preventing reverse proxy gateway timeouts and browser idle disconnects.
- **Dynamic Terminal Resizing**: Client viewport dimension changes trigger `/resize` requests, instantly aligning PTY rows and columns to match browser geometry.
- **Sleek xterm.js Canvas UI**: Embedded dark-themed terminal (`#1e1e1e`) featuring `xterm.js` v5, `FitAddon` for responsive screen adaptation, and toolbar controls for screen clearing and terminal reconnects.
- **Enterprise-Grade Security**: Configured with Express `helmet` to manage HTTP security headers and isolate terminal assets.

---

## 🛠️ Tech Stack & Dependencies

| Layer | Component | Version / Purpose |
|-------|-----------|-------------------|
| **Server Runtime** | Node.js | Asynchronous event-driven JavaScript runtime |
| **HTTP Framework** | Express | `^4.18.2` — REST & SSE event dispatch routing |
| **PTY Engine** | `node-pty` | `^1.0.0` — Native pseudoterminal binding |
| **Terminal Display** | `xterm` | `^5.1.0` — Front-end terminal component |
| **Terminal Addon** | `xterm-addon-fit` | Auto-resizes terminal canvas to container |
| **Middleware** | `body-parser` & `helmet` | Raw text payload parsing (`1mb` limit) and HTTP security |

---

## 📁 Project Structure

```plaintext
WebTerminalLinux/
├── public/
│   └── index.html         # Frontend interface, xterm.js instance, SSE listener
├── server.js              # Express server, PTY spawn logic, SSE broadcast & API routes
├── package.json           # Dependencies and startup scripts
└── package-lock.json      # Dependency lockfile
```

---

## 🔌 API & Communication Protocol

| Endpoint | Method | Content-Type | Description |
|----------|--------|--------------|-------------|
| `/events` | `GET` | `text/event-stream` | SSE stream emitting PTY data chunks and 25s `:hb` keepalives |
| `/input` | `POST` | `text/plain` | Receives client keystrokes and writes directly to PTY stdin |
| `/resize` | `POST` | `application/json` | Updates PTY dimensions (`cols`, `rows`) |
| `/ping` | `GET` | `text/plain` | Lightweight health check endpoint (`"ok"`) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `18.x` or later
- **npm** or **yarn**
- **C++ Build Tools**: Required for compiling `node-pty` native bindings (`build-essential` on Debian/Ubuntu, Visual Studio C++ Build Tools on Windows).

### 1. Clone & Install

```bash
git clone https://github.com/AryansDevStudios/WebTerminalLinux.git
cd WebTerminalLinux
npm install
```

### 2. Run the Server

```bash
# Start server using default configuration (Port 3000, 0.0.0.0)
npm start
```

### 3. Access the Terminal

Open your browser and navigate to:
```
http://localhost:3000
```

### 4. Custom Configuration (Environment Variables)

You can customize the listening port and host binding via environment variables:

```bash
# Example: bind to port 8080 on localhost
PORT=8080 HOST=127.0.0.1 npm start
```

---

## 🛡️ Reverse Proxy Configuration (Nginx)

When deploying behind Nginx or another reverse proxy, ensure output buffering is disabled for Server-Sent Events:

```nginx
server {
    listen 80;
    server_name terminal.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        
        # Essential for SSE streaming:
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 🤝 Contributing

Contributions and improvements are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit your Changes (`git commit -m 'Add support for multi-session PTY'`)
4. Push to the Branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
