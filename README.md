# 🚀 ReadyQueue — CPU Scheduling Simulator

A modern, interactive CPU Scheduling Simulator built to visualize and compare different scheduling algorithms with real-time execution timelines and performance metrics.

---

## 🌐 Live Demo

🔗 https://readyqueue.vercel.app  


---

## 🏗️ Deployment Architecture

- Frontend hosted on **Vercel**
- Backend API hosted on **Render**
- Connected via REST APIs

This separation ensures better performance, scalability, and real-world deployment structure.

---


## 🌟 Features

- 📊 **Supports Multiple Algorithms**
  - First Come First Serve (FCFS)
  - Shortest Job First (SJF)
  - Shortest Remaining Time First (SRTF)
  - Round Robin (RR)
  - Priority Scheduling (Preemptive)

- 🎯 **Gantt Chart Visualization**
  - Real-time execution timeline
  - Smooth animations and color-coded processes

- 📈 **Performance Metrics**
  - Completion Time (CT)
  - Turnaround Time (TAT)
  - Waiting Time (WT)
  - Average TAT & WT

- ⚖️ **Algorithm Comparison**
  - Compare all algorithms instantly
  - Automatically highlights the best algorithm based on lowest average waiting time

- 🎨 **Modern UI**
  - Gradient-based dark theme
  - Glassmorphism design
  - Smooth animations and transitions
  - Responsive layout

---

## 🧠 Problem It Solves

Understanding CPU scheduling algorithms can be confusing when learned only theoretically.  
ReadyQueue provides a **visual and interactive way** to:

- Understand how scheduling works
- Compare performance across algorithms
- Analyze efficiency using real data

---

## 🛠️ Tech Stack

### Frontend
- HTML, CSS, JavaScript
- Modern UI styling (Glassmorphism + Gradients)
- Custom UI inspired by modern dashboard design principles

### Backend
- Python
- Flask (API handling)

---

## ⚙️ How It Works

1. Enter number of processes  
2. Fill:
   - Arrival Time
   - Burst Time
   - (Optional) Priority  
3. Select algorithm  
4. Click **Run Simulation**  

👉 The system generates:
- Gantt Chart
- Scheduling Table
- Average Metrics  

👉 Click **Compare All Algorithms** to:
- Run all algorithms on same data
- Get best algorithm recommendation

---

## 📌 Special Logic

- Ensures **same input dataset** for fair comparison
- Prompts user for:
  - Priority (if needed)
  - Time Quantum (for Round Robin)
- No default assumptions → ensures accuracy

---

## 🚀 Future Enhancements

- 📄 Export results (PDF / CSV)
- 📊 Graph-based analytics
- 🤖 AI-based algorithm recommendation
- 🌐 Custom domain setup
- ⚡ Performance optimization (cold start handling)
- 📱 Advanced mobile UI improvements

---

## 📷 UI Highlights

- Premium dashboard-style layout  
- Smooth hover and interaction effects  
- Clean and minimal design  

---

## 🧑‍💻 Author

**Sushanth**

- Portfolio: https://sushanth17.vercel.app  
- Passionate about building practical, user-focused tech projects  

---

## ⭐ Contribution

Feel free to:
- Fork the repo  
- Suggest improvements  
- Add new algorithms  

---

## 🏁 Conclusion

ReadyQueue is not just a simulator —  
it’s a **decision-making tool** for understanding and comparing CPU scheduling strategies in a clear, visual, and modern way.

---

⭐ If you like this project, consider giving it a star!
