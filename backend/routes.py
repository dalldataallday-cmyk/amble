"""
File: routes.py
Version: 1.2.0

CHANGES FROM 1.1.0:
- ADDED: /api/user/daily-totals/<user_id> endpoint for VitalsBar persistence

Blueprints for better organization
"""
from flask import Blueprint, request, jsonify
from database_manager import DatabaseManager

# Blueprints for better organization
tasks_bp = Blueprint('tasks', __name__)
user_bp  = Blueprint('user', __name__)
meals_bp = Blueprint('meals', __name__)
plans_bp = Blueprint('plans', __name__)

db = DatabaseManager()

# ────────────────────────────────────────────────
# Existing Task & Health Routes (unchanged)
# ────────────────────────────────────────────────

@tasks_bp.route('/api/tasks', methods=['POST'])
def update_task():
    """
    Endpoint to Upsert a task.
    Expects JSON: { "task_id": "...", "file_path": "...", "file_name": "...", "description": "...", "status": "..." }
    """
    data = request.get_json()
    
    required_fields = ['task_id', 'file_path', 'file_name', 'description']
    if not all(k in data for k in required_fields):
        return jsonify({"error": "Missing required task fields"}), 400

    success = db.upsert_task(
        task_id=data['task_id'],
        file_path=data['file_path'],
        file_name=data['file_name'],
        description=data['description'],
        status=data.get('status', 'Pending')
    )

    if success:
        return jsonify({"message": f"Task {data['task_id']} processed successfully"}), 200
    else:
        return jsonify({"error": "Database operation failed"}), 500


@tasks_bp.route('/api/health', methods=['GET'])
def health_check():
    """Simple endpoint to verify the API is running."""
    return jsonify({"status": "API is online", "database": "Connected"}), 200


@tasks_bp.route('/api/diet-plans', methods=['GET'])
def get_diet_plans_route():
    """
    Endpoint to retrieve all diet plans for the combo box.
    Calls [dbo].[usp_GetDietPlans] via the Database Manager.
    """
    try:
        plans = db.get_diet_plans()
        return jsonify(plans), 200
    except Exception as e:
        print(f"[Route Error] Failed to fetch diet plans: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


# ────────────────────────────────────────────────
# User Preference Routes
# ────────────────────────────────────────────────

@user_bp.route('/api/user/preference/<int:user_id>', methods=['GET'])
def get_user_preference(user_id):
    """
    Fetch active diet preference for a user.
    Matches frontend call in App.js → /api/user/preference/2
    """
    try:
        pref = db.get_user_preference(user_id)
        if not pref:
            return jsonify({"error": f"No preferences found for user {user_id}"}), 404
        return jsonify(pref), 200
    except Exception as e:
        print(f"[User Preference GET Error] user_id={user_id}: {e}")
        return jsonify({"error": "Internal server error"}), 500


@user_bp.route('/api/user/preference', methods=['POST'])
def update_user_preference():
    """
    Update user's active diet preference.
    Matches frontend POST in App.js → handleDietChange
    Expects: { "userId": 2, "dietName": "Keto" }
    """
    data = request.get_json()
    user_id   = data.get('userId')
    diet_name = data.get('dietName')

    if not user_id or not diet_name:
        return jsonify({"error": "Missing userId or dietName"}), 400

    try:
        success = db.update_user_diet_preference(user_id, diet_name)
        if success:
            return jsonify({"message": f"Preference updated for user {user_id}"}), 200
        else:
            return jsonify({"error": "Failed to update preference"}), 500
    except Exception as e:
        print(f"[User Preference POST Error] user_id={user_id}: {e}")
        return jsonify({"error": "Internal server error"}), 500


# ────────────────────────────────────────────────
# NEW: Daily Totals Route (for VitalsBar persistence)
# ────────────────────────────────────────────────

@user_bp.route('/api/user/daily-totals/<int:user_id>', methods=['GET'])
def get_user_daily_totals(user_id):
    """
    NEW: Fetch daily nutritional totals for a user.
    Used by App.js to persist VitalsBar data across page refreshes.
    
    Optional query params:
      - date: ISO date string (defaults to today)
    
    Returns:
      {
        "TotalCalories": 520,
        "TotalProtein": 38,
        "TotalFat": 28,
        "TotalCarbs": 22,
        "MealCount": 1,
        "ForDate": "2026-01-30"
      }
    """
    target_date = request.args.get('date')  # Optional: '2026-01-30'
    
    try:
        totals = db.get_daily_totals(user_id, target_date)
        if totals is None:
            # Return zeros if no data (not an error)
            return jsonify({
                "TotalCalories": 0,
                "TotalProtein": 0,
                "TotalFat": 0,
                "TotalCarbs": 0,
                "MealCount": 0,
                "ForDate": target_date or "today"
            }), 200
        return jsonify(totals), 200
    except Exception as e:
        print(f"[Daily Totals Error] user_id={user_id}, date={target_date}: {e}")
        return jsonify({"error": "Internal server error"}), 500


# ────────────────────────────────────────────────
# Meal Suggestion Route
# ────────────────────────────────────────────────

@meals_bp.route('/api/meals/suggest', methods=['GET'])
def suggest_random_meal():
    """
    Returns a random meal matching the requested diet category.
    Matches Dashboard.jsx → /api/meals/suggest?diet=Keto
    Uses existing db.get_random_meal_by_diet()
    """
    diet = request.args.get('diet')
    if not diet:
        return jsonify({"error": "Missing 'diet' query parameter"}), 400

    try:
        meal_data = db.get_random_meal_by_diet(diet)
        if not meal_data:
            return jsonify({"error": f"No meals available for diet: {diet}"}), 404
        
        return jsonify(meal_data), 200
    except Exception as e:
        print(f"[Meal Suggest Error] diet={diet}: {e}")
        return jsonify({"error": "Internal server error"}), 500


# ────────────────────────────────────────────────
# Meal Plan Creation Route
# ────────────────────────────────────────────────

@plans_bp.route('/api/meal-plans/add', methods=['POST'])
def add_meal_plan():
    """
    Create a new meal plan entry for a user.
    Matches Dashboard.jsx → acceptSuggestion POST
    Expects: { "userId": 2, "mealId": 42, "plannedDate": "2025-04-10", "mealTime": "Lunch" }
    """
    data = request.get_json()
    
    user_id     = data.get('userId')
    meal_id     = data.get('mealId')
    planned_date = data.get('plannedDate')
    meal_time   = data.get('mealTime', 'Lunch')  # optional, default

    if not all([user_id, meal_id, planned_date]):
        return jsonify({"error": "Missing required fields: userId, mealId, plannedDate"}), 400

    try:
        success = db.insert_meal_plan(
            user_id=user_id,
            meal_id=meal_id,
            planned_date=planned_date,
            meal_time=meal_time
        )
        
        if success:
            return jsonify({"message": "Meal plan added successfully"}), 201
        else:
            return jsonify({"error": "Failed to save meal plan"}), 500
    except Exception as e:
        print(f"[Meal Plan Add Error] user={user_id} meal={meal_id}: {e}")
        return jsonify({"error": "Internal server error"}), 500


# ────────────────────────────────────────────────
# Register all blueprints (add this to your main app.py / server file)
# ────────────────────────────────────────────────
# Example (in your main Flask app file):
#
# from routes import tasks_bp, user_bp, meals_bp, plans_bp
# app.register_blueprint(tasks_bp)
# app.register_blueprint(user_bp)
# app.register_blueprint(meals_bp)
# app.register_blueprint(plans_bp)
