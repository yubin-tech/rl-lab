
# RL-Lab: Bellman Equation Explorer

An interactive, purely static Reinforcement Learning visualizer built with React. Master Markov Decision Processes, Value Iteration, and Q-Learning through real-time grid manipulation.

## 🚀 Deployment Instructions

This app is designed to be deployed to static hosting providers.

### 1. Cloudflare Pages (Recommended)
1. Push your code to a GitHub repository.
2. Log in to the Cloudflare Dashboard.
3. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
4. Select your repository.
5. Use the following build settings:
   - **Framework preset**: React (Vite) or None (manual)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
6. Pin Node by committing `.nvmrc` (this repo uses Node 22).
7. Click **Save and Deploy**.

### 2. GitHub Pages
1. Go to your repository **Settings** > **Pages**.
2. Under **Build and deployment**, select **GitHub Actions**.
3. Choose the **Static HTML** or **Vite** starter workflow depending on your local build environment.

## 🛠 Tech Stack
- **React 19**
- **Lucide React** (Icons)
- **Recharts** (Convergence visualization)
- **Tailwind CSS** (Styling)

## 💡 Key Features
- **Algorithm Lab**: Toggle between Value Iteration, Policy Iteration, and Q-Learning.
- **Bellman Deep Dive**: Expand the explorer to see the exact sum-of-expectations math for any state.
- **Grid manipulation**: Right-click to paint walls, traps, and goals.
- **Purely Static**: No backend or API keys required.
