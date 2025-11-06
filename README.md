# MeAndMoney - Personal Finance Manager

MeAndMoney is a modern, AI-powered personal finance application designed to help you take control of your financial life. Track your spending, create budgets, set and manage goals, and gain valuable insights into your financial habits through a clean, intuitive interface.

## ✨ Features

- **Unified Dashboard**: Get a comprehensive overview of your total balance, monthly income, expenses, and net cash flow at a glance.
- **AI-Powered Insights**: Receive personalized, actionable tips from our AI to help you save money and improve your financial habits.
- **Transaction Management**: Automatically categorize transactions and manually add, edit, or delete them with ease.
- **Money Sources**: Manage all your financial accounts, including bank accounts, credit cards, and cash, in one place.
- **Budgeting**: Set monthly spending limits for different categories and track your progress to stay on budget.
- **Goal Setting**: Define your financial goals, from saving for a vacation to a down payment, and monitor your progress.
- **Secure Authentication**: Safe and secure user authentication using Firebase, with support for email/password and Google sign-in.
- **Responsive Design**: A fully responsive interface that works seamlessly on desktop and mobile devices.
- **Customizable Theme**: Switch between light, dark, and system themes to match your preference.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN/UI](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Backend & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Authentication)
- **Generative AI**: [Genkit](https://firebase.google.com/docs/genkit)
- **Form Management**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or later)
- [npm](https://www.npmjs.com/) or a compatible package manager

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    - Create a `.env.local` file in the root of the project.
    - You will need to get your Firebase project configuration keys from the Firebase Console.
    - Go to **Project settings** > **General** > **Your apps**, and select **Config** for your web app.
    - Copy the keys into your `.env.local` file as shown below:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

    The application will be available at `http://localhost:9002`.

## 📦 Deployment

This application is configured for easy deployment on platforms like Vercel or Firebase App Hosting.

When deploying to Vercel, ensure you add the Firebase environment variables (listed above) in your Vercel project settings.

## 📄 License

This project is licensed under the MIT License - see the [LICENCE.md](LICENCE.md) file for details.
