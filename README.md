
# 🏗️ **Architectural AI Agent**

> 💡 *An AI-powered assistant that designs building floor plans, checks them against Indian building codes, and estimates construction materials — all automatically!*

---

## 🌍 **Overview**

The **Architectural AI Agent** is an intelligent system that **creates 2D floor plans**, **verifies compliance** with Indian building rules (like the **National Building Code (NBC) 2016** and **local metro regulations**), and **estimates construction materials and costs** — all in just a few clicks.

It’s specially designed for **Indian cities like Mumbai and Delhi**, where construction follows strict codes and diverse conditions (soil, seismic zones, etc.).

✨ *In short, it helps architects, builders, and developers save time, avoid costly errors, and make data-driven design decisions.*

---

## 🏆 **Project Goals**

| 🎯 Objective                      | 🧱 Description                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| 🏠 **Auto-Design Floor Plans**    | Generate optimized 2D house layouts using AI from basic inputs (e.g., plot size, number of rooms). |
| ✅ **Verify Compliance**           | Automatically check NBC and metro-specific rules (like FSI, setbacks, and open space).             |
| 🔢 **Estimate Materials & Cost**  | Calculate materials (cement, steel, bricks, etc.) and total construction cost with <5% error.      |
| 🧱 **Visualize in 3D (Optional)** | Create 3D models using Blender’s Python API for beautiful visual walkthroughs.                     |

---

## 👥 **Who It’s For**

* 🧑‍💼 **Architects** – Quickly test and verify multiple design options
* 🏗️ **Builders/Contractors** – Estimate material and cost instantly
* 🏢 **Real Estate Developers** – Validate large-scale layouts efficiently
* 🏡 **Homeowners** – Get accurate design & cost ideas before hiring professionals

---

## 🚀 **Core Features**

### 🏠 1. 2D Floor Plan Generation

* Generates layout automatically from simple inputs:

  * Plot size (e.g., 50m × 30m)
  * Number and type of rooms
  * Orientation and entry point
* Uses AI techniques like **GANs (Generative Adversarial Networks)** and **graph-based optimization** to create functional plans.
* Produces **ready-to-use 2D drawings (PDF/PNG)**.

---

### ⚖️ 2. Compliance Verification

* Checks designs against:

  * **NBC 2016** (fire safety, open space, ventilation, etc.)
  * **Metro-specific rules** (e.g., Mumbai’s DCR, Delhi’s Master Plan)
* Uses **rule-based NLP (spaCy)** to interpret text from official codes.
* Generates a **Compliance Report** highlighting ✅ passed and ❌ failed rules.

---

### 🧮 3. Material Estimation

* Estimates:

  * Material quantities (cement, bricks, steel, etc.)
  * Cost breakdown based on:

    * 🪨 Soil type
    * 🌍 Seismic zone
    * 💰 Budget range
    * 🧱 Local material availability (via APIs like **IndiaMart**)
* Output: Excel/PDF report with material list and cost.

---

### 🧰 4. Optional 3D Visualization

* Converts generated 2D floor plans to **3D models** using **Blender’s Python API (`bpy`)**.
* Supports:

  * 3D walkthroughs
  * AR/VR export
  * Photorealistic rendering

---

## 🧠 **Tech Stack**

| 🔧 Category           | 🧩 Tools & Frameworks          |
| --------------------- | ------------------------------ |
| **Languages**         | Python 🐍, JavaScript ⚙️       |
| **AI/ML**             | PyTorch, NetworkX, spaCy       |
| **Data & Estimation** | Pandas, SciPy                  |
| **Visualization**     | OpenCV, Matplotlib             |
| **Frontend (UI)**     | Streamlit (MVP) → React (Full) |
| **Backend (API)**     | FastAPI                        |
| **Database**          | PostgreSQL + PostGIS 🌐        |
| **3D Engine**         | Blender (bpy) 🧱               |
| **Deployment**        | Docker 🐳, AWS ☁️              |
| **Version Control**   | Git + GitHub                   |
| **Testing**           | PyTest 🧪                      |

---

## 🧩 **Inputs & Outputs**

| 📝 Input                                 | 📤 Output                           |
| ---------------------------------------- | ----------------------------------- |
| Plot dimensions (e.g., 50x30m)           | 🏗️ Auto-generated 2D plan          |
| Number of rooms, floors                  | 🏠 Optimized layout image (PNG/PDF) |
| Location (city, soil type, seismic zone) | ⚖️ Compliance report                |
| Budget range                             | 💰 Material & cost estimate         |
| Preferred materials                      | 🧱 Material summary table           |
| —                                        | 🧊 Optional 3D model (via Blender)  |

---

## ⚙️ **Installation Guide**

1. **Clone the repo:**

   ```bash
   git clone https://github.com/<your-repo>/architectural-ai-agent.git
   cd architectural-ai-agent
   ```

2. **Create a virtual environment:**

   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**

   ```bash
   pip install torch opencv-python pandas scipy streamlit bpy networkx spacy fastapi
   ```

4. **Install Blender** (v3.0+):
   Ensure `bpy` module is accessible inside Python environment.

5. **Run the app:**

   ```bash
   streamlit run app.py
   ```

---

## 🧭 **How to Use**

1. Open the Streamlit app (`streamlit run app.py`)
2. Enter your project details (e.g., 50x30m plot, 3 BHK, ₹50L budget, Mumbai)
3. Click **“Generate Plan”** 🏗️
4. Review:

   * 🏠 Floor plan
   * ⚖️ Compliance report
   * 🧱 Material & cost estimate
5. Optionally click **“Generate 3D Model”** 🧊 for visualization

---

## 🛠️ **Development Roadmap (6–12 Months)**

| 🚦 Stage                    | 🕒 Duration | 📦 Deliverable                              |
| --------------------------- | ----------- | ------------------------------------------- |
| 1️⃣ Project Setup           | 1–2 weeks   | Basic app structure                         |
| 2️⃣ Data Collection         | 3–4 weeks   | Curated floor plan dataset + building rules |
| 3️⃣ AI Floor Plan Generator | 4–6 weeks   | GAN-based layout generator                  |
| 4️⃣ Compliance Module       | 4–5 weeks   | Rule-checking engine                        |
| 5️⃣ Material Estimation     | 4–5 weeks   | Estimator tool                              |
| 6️⃣ Integration             | 3–4 weeks   | Unified pipeline                            |
| 7️⃣ UI/Frontend             | 3–4 weeks   | Streamlit app                               |
| 8️⃣ 3D Extension            | 2–3 weeks   | Blender integration                         |
| 9️⃣ Testing & Validation    | 3–4 weeks   | Test suite + case studies                   |
| 🔟 Deployment & Docs        | 2–3 weeks   | AWS-hosted MVP                              |

---

## 🔮 **Future Enhancements**

✨ **Expand Regionally** – Add rules for Bangalore, Chennai, Kolkata
📡 **Real-Time Data** – Integrate APIs for live material prices and soil data
🧠 **Smarter AI** – Use diffusion models & reinforcement learning for layout optimization
🏗️ **BIM Support** – Export to Revit, STAAD.Pro
📱 **Mobile App** – Android/iOS for on-site use
🕶️ **AR/VR Integration** – Walk through your home before it’s built!

---

## 🙌 **Attributions**

* 📊 **Datasets**: RPLAN, BIS NBC 2016 PDFs, OpenStreetMap
* 🧠 **Libraries**: PyTorch, spaCy, Pandas, SciPy, NetworkX, OpenCV, Streamlit, FastAPI, Blender
* 💡 **Inspiration**: FloorplanToBlender3d (GitHub), Autodesk Project Dreamcatcher
* 🏗️ **Consultants**: Collaboration planned with certified Indian architects for validation

---

## 🤝 **Contributing**

Want to contribute? Awesome! 🚀

1. Fork the repo
2. Create a branch:

   ```bash
   git checkout -b feature/<your-feature-name>
   ```
3. Commit your changes:

   ```bash
   git commit -m "Added new feature"
   ```
4. Push and open a Pull Request on GitHub ✅

---

## ⚖️ **License**

🪪 Licensed under the **MIT License**.
See `LICENSE` file for full terms.

---

## 📬 **Contact**

For questions, collaborations, or demos:
📧 Email: `<your-email>`
🐙 GitHub: [Open an Issue](https://github.com/<your-repo>/issues)

---
