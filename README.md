![EpicStaff Logo](logo.png)

**EpicStaff** is an open-source platform designed primarily for developers, yet fully accessible to non-developers for orchestrating high-performance, agent-driven AI workflows. It provides fine-grained, low-level control over task orchestration within a lean, asynchronous architecture.

The platform includes a clean, modular backend for developers and a graphic interface for building, editing, and managing projects visually – enabling seamless experimentation and debugging whether you prefer code or clicks.

EpicStaff is built for **precision, speed, and flexibility**: rather than relying on fixed templates or hidden abstractions, developers define custom workflows directly in code and can plug in any language model or AI service. This transparency and efficiency make EpicStaff ideal for building custom, event-driven agent systems.

EpicStaff is designed for those who want to go **beyond generic agents** and build **production-grade AI systems** with memory, reasoning, external tools, and model flexibility.

---

## 🔧 Key Features

### 🧩 Graphic Project Builder (Frontend UI)
Create, configure, and run your own agentic projects via an intuitive web interface. Define agents, assign tools, track progress – all without touching YAML.

### 🧠 Memory Persistence
Enable agents to retain and retrieve memory across steps or workflows, improving long-term consistency and contextual reasoning.

### 📚 Knowledge Injection
Equip agents with knowledge from files, documents, or structured data sources and use it during reasoning, writing, or analysis tasks.

### 🐍 Custom Python Tools
Define and integrate your own Python tools – and manage them directly from the frontend. No need to hard-code logic or redeploy.

### 🛠️ Developer-Centric Control
Fine-grained orchestration API letting developers manage each step of AI workflows directly, without hidden abstractions or rigid templates.

### ⚡ High-Performance Core
Asynchronous, minimal-overhead architecture optimized for speed and concurrency, enabling rapid execution of complex tasks.

### 🧱 Modular Backend
Pluggable, RESTful service architecture built for flexible extension, scalable integration, and easy deployment of custom components.

### 🌍 Open-Source
Community-driven and permissively licensed, focusing on transparency and developer freedom rather than proprietary lock-in.

### 🤖 LLM & Workflow Compatibility
Designed to integrate seamlessly with any language model or AI service and to support explicit, structured multi-step workflows out of the box.
---

## Mission

We aim to empower businesses and developers with advanced AI-driven solutions that foster **collaboration** and **efficiency**.  
By embracing the latest advancements in AI, we strive to create a seamless and intuitive experience for users — whether they are automating workflows or developing new applications.

---

## Core Values

- **Continuous Innovation**  
  We are committed to staying at the forefront of AI technology, ensuring our tools remain relevant and effective in a rapidly evolving landscape.

- **User-Centric Approach**  
  Our focus is on delivering solutions that meet the diverse needs of our users, from developers to non-technical teams, ensuring everyone can leverage AI to enhance their workflows.

- **Collaborative Spirit**  
  We believe in the power of collaboration — between humans and AI, as well as within our community. This spirit drives us to build tools that facilitate seamless interaction and mutual support.

## Join Us

Join the journey with **EpicStaff**, and together let’s shape the future of intelligent collaboration!

---

# Downloader

## Requirements
- **Git**  
- **Docker Desktop** (Must be running)

---

## 🚀 Getting Started

### 🪟 Windows

1. **Install dependencies**  
   - [Git](https://git-scm.com/download/win)  
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/)

2. **Start Docker Desktop**

3. **Download the project**  
   Double-click `downloader.bat`

4. **Navigate to the program directory**  
   ```bash
   cd run_program/windows
   ```

5. **Update the program**  
   Double-click `update.bat`

6. **Run the program**  
   Double-click `run_project.bat`

7. **Open the app**  
   Visit: [http://127.0.0.1:4200/](http://127.0.0.1:4200/)

---

### 🐧 Linux / 🍎 macOS

1. **Install dependencies**  
   - [Git](https://git-scm.com/downloads)  
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/)

2. **Start Docker Desktop**

3. **Download the project**  
   ```bash
   chmod +x downloader.sh
   ./downloader.sh
   ```

4. **Navigate to the program directory**  
   ```bash
   cd run_program/linux_mac
   ```

5. **Update the program**
   ```bash
   chmod +x update.sh
   ./update.sh
   ```

6. **Run the program**
   ```bash
   chmod +x run_project.sh
   ./run_project.sh
   ```

7. **Open the app**  
   Visit: [http://127.0.0.1:4200/](http://127.0.0.1:4200/)
