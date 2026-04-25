# Backend Developer Guide (Django + PostgreSQL)

Welcome to the backend team! We are using **Django** and **PostgreSQL**. Please follow these steps to ensure your local database and environment match the team standard.

## 🛠 Prerequisites

Ensure you have the following installed:

- [Python 3.x](https://www.python.org/)
- [PostgreSQL](https://www.postgresql.org/download/)
- `pip` (Python package manager)

## 🚀 Local Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/trends-project.git
   cd trends-project
   ```

2. **Navigate to Backend:**

   ```bash
   cd backend
   ```

3. **Set up Virtual Environment:**

   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

4. **Install Dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

5. **Database Configuration:**
   - Create a PostgreSQL database named `trends_db`.
   - Create a `.env` file in the `/backend/core` folder (or wherever your settings are) and add your DB credentials.

6. **Apply Migrations & Run:**

   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

## 🌳 Git Workflow & Branching

We use a dedicated branching strategy to keep the backend logic isolated until it is tested.

### 1. Start from the Dev Branch

Always ensure your local `dev` branch is up to date before starting a new feature.

```bash
git checkout dev
git pull origin dev
```

### 2. Create a Feature Branch

Use the naming convention: `BE-FeatureName`

```bash
git checkout -b BE-NameOfYourFeature
```

### 3. Commit and Push

Keep your commits descriptive.

```bash
git add .
git commit -m "feat: added authentication endpoints"
git push origin BE-NameOfYourFeature
```

### 4. Open a Pull Request (PR)

1. Create a PR on GitHub from `BE-NameOfYourFeature` → `dev`.
2. Ensure your code passes all local tests before requesting a review.
3. Do **not** merge directly into `main`.

## 🔍 Troubleshooting GitHub Issues

- **Venv not showing in Git:** This is intentional. The `venv` folder is in `.gitignore` to prevent uploading your local environment.

- **Database Conflicts:** If a teammate changed the models, pull the `dev` branch and run `python manage.py migrate` to sync your local database.

- **Push Rejected:** If your push is rejected, run `git pull origin <your-branch-name>` to sync any changes made on GitHub first.

- **Detached HEAD:** If you find yourself in a detached HEAD state, run `git checkout BE-FeatureName` to return to your branch.
