"""
File: database_manager.py
Version: 1.3.0

CHANGES FROM 1.2.2:
- ADDED: get_daily_totals() method for VitalsBar persistence
- Fixed Status constraint ('Pending' instead of 'Planned')

Description: 
- Modern ODBC driver + connection test
- Safe date handling in insert_meal_plan
- All methods for Amble dashboard functionality
"""
import pyodbc
from datetime import date, datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.server = 'DESKTOP-G76966Q'
        self.database = 'Amble'
        
        drivers = [
            "ODBC Driver 18 for SQL Server",
            "ODBC Driver 17 for SQL Server",
            "SQL Server Native Client 11.0",
            "SQL Server",
        ]
        
        self.conn_str = None
        for driver in drivers:
            try:
                conn_str = (
                    f"DRIVER={{{driver}}};"
                    f"SERVER={self.server};"
                    f"DATABASE={self.database};"
                    "Trusted_Connection=yes;"
                    "Encrypt=no;"
                )
                with pyodbc.connect(conn_str, timeout=5) as test_conn:
                    logger.info(f"Using ODBC driver: {driver}")
                    self.conn_str = conn_str
                    break
            except Exception:
                continue
        
        if not self.conn_str:
            raise RuntimeError("No working ODBC driver found. Install ODBC Driver 17/18.")

    def _get_connection(self):
        try:
            return pyodbc.connect(self.conn_str, timeout=10)
        except Exception as e:
            logger.error(f"Connection failed: {e}", exc_info=True)
            return None

    # ────────────────────────────────────────────────────────────────────────────
    # NEW: Get Daily Totals for VitalsBar Persistence
    # ────────────────────────────────────────────────────────────────────────────

    def get_daily_totals(self, user_id, target_date=None):
        """
        Retrieve aggregated nutritional totals for a user's meal plans for a specific date.
        
        Args:
            user_id: The user's ID
            target_date: ISO date string (YYYY-MM-DD) or None for today
            
        Returns:
            dict with TotalCalories, TotalProtein, TotalFat, TotalCarbs, MealCount, ForDate
            or None if error
        """
        conn = self._get_connection()
        if not conn:
            return None
        
        try:
            cursor = conn.cursor()
            
            # Use stored procedure if available, otherwise inline SQL
            try:
                if target_date:
                    cursor.execute("{CALL dbo.usp_GetUserDailyTotals (?, ?)}", (user_id, target_date))
                else:
                    cursor.execute("{CALL dbo.usp_GetUserDailyTotals (?)}", (user_id,))
            except pyodbc.ProgrammingError:
                # Stored procedure doesn't exist, use inline SQL
                logger.warning("usp_GetUserDailyTotals not found, using inline SQL")
                
                if target_date is None:
                    target_date = date.today().isoformat()
                
                cursor.execute("""
                    SELECT 
                        ISNULL(SUM(m.Calories), 0) AS TotalCalories,
                        ISNULL(SUM(m.ProteinGrams), 0) AS TotalProtein,
                        ISNULL(SUM(m.FatGrams), 0) AS TotalFat,
                        ISNULL(SUM(m.CarbGrams), 0) AS TotalCarbs,
                        COUNT(mp.PlanID) AS MealCount
                    FROM dbo.MealPlans mp
                    INNER JOIN dbo.Meals m ON mp.MealID = m.MealID
                    WHERE mp.UserID = ?
                      AND mp.PlannedDate = CAST(? AS DATE)
                      AND mp.Status IN ('Pending', 'Accepted')
                """, (user_id, target_date))
            
            row = cursor.fetchone()
            if row:
                return {
                    "TotalCalories": row[0] or 0,
                    "TotalProtein": row[1] or 0,
                    "TotalFat": row[2] or 0,
                    "TotalCarbs": row[3] or 0,
                    "MealCount": row[4] or 0,
                    "ForDate": target_date or date.today().isoformat()
                }
            return None
            
        except Exception as e:
            logger.error(f"Failed to get daily totals for user {user_id}: {e}", exc_info=True)
            return None
        finally:
            conn.close()

    # ────────────────────────────────────────────────────────────────────────────
    # Task Management
    # ────────────────────────────────────────────────────────────────────────────

    def upsert_task(self, task_id, file_path, file_name, description, status='Pending'):
        conn = self._get_connection()
        if not conn:
            return False
        try:
            cursor = conn.cursor()
            cursor.execute(
                "{CALL sp_UpsertTask (?, ?, ?, ?, ?)}",
                (task_id, file_path, file_name, description, status)
            )
            conn.commit()
            logger.info(f"[Registry] Synced: {task_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to upsert task {task_id}: {e}", exc_info=True)
            return False
        finally:
            conn.close()

    # ────────────────────────────────────────────────────────────────────────────
    # Meal Management
    # ────────────────────────────────────────────────────────────────────────────

    def get_random_meal_by_diet(self, diet_category):
        conn = self._get_connection()
        if not conn:
            return None
        try:
            cursor = conn.cursor()
            cursor.execute("{CALL dbo.usp_GetRandomMealByDiet (?)}", (diet_category,))
           
            meal_row = cursor.fetchone()
            if not meal_row:
                logger.warning(f"No meal found for diet: {diet_category}")
                return None
                
            meal_data = {
                "MealID": meal_row[0],
                "MealName": meal_row[1],
                "ImageURL": meal_row[2],
                "ProteinGrams": meal_row[3],
                "FatGrams": meal_row[4],
                "CarbGrams": meal_row[5]
            }
            
            # Check if Calories column exists (might be at index 6)
            if len(meal_row) > 6:
                meal_data["Calories"] = meal_row[6]
            
            ingredients = []
            if cursor.nextset():
                for row in cursor.fetchall():
                    ingredients.append({
                        "IngredientName": row[0],
                        "Quantity": row[1],
                        "SmartGroup": row[2]
                    })
            meal_data["ingredients"] = ingredients
            return meal_data
        except Exception as e:
            logger.error(f"Failed to fetch meal for {diet_category}: {e}", exc_info=True)
            return None
        finally:
            conn.close()

    # ────────────────────────────────────────────────────────────────────────────
    # Diet Plans
    # ────────────────────────────────────────────────────────────────────────────

    def get_diet_plans(self):
        conn = self._get_connection()
        if not conn:
            return []
        try:
            cursor = conn.cursor()
            cursor.execute("{CALL [dbo].[usp_GetDietPlans]}")
           
            columns = [column[0] for column in cursor.description]
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
           
            return results
        except Exception as e:
            logger.error(f"Failed to fetch diet plans: {e}", exc_info=True)
            return []
        finally:
            conn.close()

    # ────────────────────────────────────────────────────────────────────────────
    # User Preferences
    # ────────────────────────────────────────────────────────────────────────────

    def update_user_preferences(self, user_id, diet_type, calories_goal, allergies):
        conn = self._get_connection()
        if not conn:
            return False
        try:
            cursor = conn.cursor()
            cursor.execute("{CALL dbo.usp_UpdateUserPreferences (?, ?, ?, ?)}",
                           (user_id, diet_type, calories_goal, allergies))
            conn.commit()
            logger.info(f"[Profile] Updated preferences for User: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to update preferences for user {user_id}: {e}", exc_info=True)
            return False
        finally:
            conn.close()

    def update_user_diet_preference(self, user_id, diet_name):
        default_calories = 2500
        default_allergies = ""
        return self.update_user_preferences(
            user_id=user_id,
            diet_type=diet_name,
            calories_goal=default_calories,
            allergies=default_allergies
        )

    def get_user_preference(self, user_id):
        conn = self._get_connection()
        if not conn:
            return None
        try:
            cursor = conn.cursor()
            # Only select column that actually exists
            cursor.execute("""
                SELECT ActiveDietName
                FROM UserPreferences
                WHERE UserID = ? AND IsActive = 1
            """, (user_id,))
           
            row = cursor.fetchone()
            if row:
                return {"ActiveDietName": row[0]}
            return None
        except Exception as e:
            logger.error(f"Failed to get preference for user {user_id}: {e}", exc_info=True)
            return None
        finally:
            conn.close()

    # ────────────────────────────────────────────────────────────────────────────
    # Meal Plan Management
    # ────────────────────────────────────────────────────────────────────────────

    def insert_meal_plan(self, user_id, meal_id, planned_date, meal_time='Lunch'):
        conn = self._get_connection()
        if not conn:
            return False

        if isinstance(planned_date, (date, datetime)):
            planned_date_str = planned_date.isoformat()[:10]
        elif isinstance(planned_date, str):
            planned_date_str = planned_date
        else:
            logger.error(f"Invalid planned_date type: {type(planned_date)}")
            return False

        try:
            cursor = conn.cursor()
            # FIXED: Use 'Pending' instead of 'Planned' to match CHECK constraint
            cursor.execute("""
                INSERT INTO MealPlans 
                    (UserID, MealID, PlannedDate, MealTime, Status)
                VALUES (?, ?, CAST(? AS DATE), ?, 'Pending')
            """, (user_id, meal_id, planned_date_str, meal_time))
            
            conn.commit()
            logger.info(f"Meal plan added | user={user_id} meal={meal_id} date={planned_date_str}")
            return True
        except pyodbc.Error as e:
            logger.error(f"SQL Error inserting meal plan: {e}", exc_info=True)
            return False
        except Exception as e:
            logger.error(f"Unexpected error: {e}", exc_info=True)
            return False
        finally:
            conn.close()


# ────────────────────────────────────────────────────────────────────────────
# Self-Test
# ────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    try:
        db = DatabaseManager()
        print("DatabaseManager initialized successfully")
        
        # Show available methods
        print("Available methods:", [m for m in dir(db) if callable(getattr(db, m)) and not m.startswith('_')])
        
        # Test get_daily_totals
        print("\n=== Testing get_daily_totals ===")
        totals = db.get_daily_totals(2)
        print(f"Daily totals for User 2: {totals}")
        
        # Test get_user_preference
        print("\n=== Testing get_user_preference ===")
        pref = db.get_user_preference(2)
        print(f"User 2 preference: {pref}")
        
    except Exception as e:
        logger.error("Test block failed", exc_info=True)
