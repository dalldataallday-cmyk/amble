from flask import Flask
from flask_cors import CORS
from routes import tasks_bp, user_bp, meals_bp, plans_bp   # ← added missing imports

def create_app():
    app = Flask(__name__)
    
    # Enable CORS for React[](http://localhost:3000) → Flask (5000)
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

    # Register ALL blueprints from routes.py v1.1.0
    app.register_blueprint(tasks_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(meals_bp)
    app.register_blueprint(plans_bp)

    @app.route('/')
    def index():
        return "Amble API is Running. Use /api/health, /api/diet-plans, /api/meals/suggest, etc."

    # Optional: debug route to list all registered endpoints
    @app.route('/debug/routes')
    def debug_routes():
        import urllib
        output = []
        for rule in app.url_map.iter_rules():
            methods = ','.join(rule.methods)
            output.append(f"{rule.endpoint:50s} {methods:20s} {rule}")
        return "<pre>" + "\n".join(sorted(output)) + "</pre>"

    return app

if __name__ == "__main__":
    print("------------------------------------------")
    print("Amble Backend (Flask) Starting...")
    print("Target Database: Amble on DESKTOP-G76966Q")
    print("Policy: Procedure-Only (No Raw SQL)")
    print("CORS enabled for http://localhost:3000")
    print("Visit /debug/routes to verify endpoints")
    print("------------------------------------------")
    
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)