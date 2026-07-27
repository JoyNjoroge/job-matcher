import sys
import types
import unittest


# The repository's default frontend environment does not install Flask. Stub
# route-only dependencies so these pure matching/validation tests still run.
try:
    import flask  # noqa: F401
except ModuleNotFoundError:
    flask_stub = types.ModuleType("flask")

    class Blueprint:
        def __init__(self, *_args, **_kwargs):
            pass

        def route(self, *_args, **_kwargs):
            return lambda function: function

    flask_stub.Blueprint = Blueprint
    flask_stub.g = types.SimpleNamespace(user_id="test-user")
    flask_stub.jsonify = lambda value: value
    flask_stub.request = types.SimpleNamespace()
    sys.modules["flask"] = flask_stub

    database_stub = types.ModuleType("database")
    database_stub.get_db_helper = lambda: None
    sys.modules["database"] = database_stub

    services_stub = types.ModuleType("services")
    services_ai_stub = types.ModuleType("services.ai")
    services_ai_stub._generate_content_text = lambda *_args, **_kwargs: "{}"
    services_auth_stub = types.ModuleType("services.auth")
    services_auth_stub.require_auth = lambda function: function
    services_subscription_stub = types.ModuleType("services.subscription")
    services_subscription_stub.require_feature = lambda *_args: (
        lambda function: function
    )
    sys.modules["services"] = services_stub
    sys.modules["services.ai"] = services_ai_stub
    sys.modules["services.auth"] = services_auth_stub
    sys.modules["services.subscription"] = services_subscription_stub

from routes.extension_route import (
    _evidence_blob,
    _nontechnical_entities,
    _rule_based,
    _validate_ai_suggestion,
)


PROFILE = {
    "first_name": "Joy",
    "last_name": "Njoroge",
    "full_name": "Joy Njoroge",
    "email": "joy@example.com",
    "phone": "+254700000000",
    "city": "Nakuru",
    "state": "Nakuru County",
    "country": "Kenya",
    "postal_code": "20100",
    "address_line1": "123 Example Road",
    "skills": "Python, SQL, Snowflake",
    "job_title": "Actuarial Intern",
    "job_titles": ["Actuarial Intern"],
    "work_experience": [
        {
            "company": "Example Insurance",
            "title": "Actuarial Intern",
            "description": "Built reporting models using SQL and Snowflake.",
        }
    ],
    "education": [],
    "additional_details": {},
}
RESUME = {
    "parsed": {
        "skills": ["Python", "SQL", "Snowflake"],
        "work_experience": PROFILE["work_experience"],
    },
    "raw_text": "Built reporting models using SQL and Snowflake.",
}


class ExtensionAutofillTests(unittest.TestCase):
    def test_exact_profile_fields_are_deterministic(self):
        fields = [
            {"index": 0, "label": "First Name", "name": "first_name"},
            {"index": 1, "label": "City", "name": "city"},
        ]
        results = _rule_based(fields, PROFILE)
        self.assertEqual(results[0]["suggestedValue"], "Joy")
        self.assertEqual(results[0]["answerMode"], "profile")
        self.assertEqual(results[1]["suggestedValue"], "Nakuru")

    def test_database_question_is_not_filled_with_job_title_by_rules(self):
        field = {
            "index": 0,
            "label": "Which columnar databases have you used in previous roles?",
            "name": "question_1",
            "type": "textarea",
        }
        result = _rule_based([field], PROFILE)[0]
        self.assertIsNone(result["suggestedValue"])

    def test_job_title_is_rejected_as_database_answer(self):
        field = {
            "index": 0,
            "label": "Which columnar databases have you used in previous roles?",
            "name": "question_1",
        }
        blob = _evidence_blob(PROFILE, RESUME)
        result = _validate_ai_suggestion(
            {
                "index": 0,
                "suggestedValue": "Actuarial Intern",
                "confidence": "high",
                "answerMode": "resume_evidence",
                "sourceEvidence": "Actuarial Intern",
                "reason": "Found in the resume.",
            },
            field,
            blob,
            _nontechnical_entities(PROFILE, RESUME),
        )
        self.assertIsNone(result["suggestedValue"])

    def test_grounded_database_answer_is_accepted(self):
        field = {
            "index": 0,
            "label": "Which databases have you used in previous roles?",
            "name": "question_1",
        }
        blob = _evidence_blob(PROFILE, RESUME)
        result = _validate_ai_suggestion(
            {
                "index": 0,
                "suggestedValue": "SQL, Snowflake",
                "confidence": "high",
                "answerMode": "resume_evidence",
                "sourceEvidence": "Built reporting models using SQL and Snowflake.",
                "reason": "Both are stated in the primary resume.",
            },
            field,
            blob,
            _nontechnical_entities(PROFILE, RESUME),
        )
        self.assertEqual(result["suggestedValue"], "SQL, Snowflake")
        self.assertEqual(result["answerMode"], "resume_evidence")

    def test_availability_stays_blank_without_explicit_profile_value(self):
        field = {
            "index": 0,
            "label": "When are you available to start?",
            "name": "availability",
        }
        result = _rule_based([field], PROFILE)[0]
        self.assertIsNone(result["suggestedValue"])
        self.assertIn("not explicitly saved", result["reason"])

    def test_existing_value_is_never_replaced(self):
        field = {
            "index": 0,
            "label": "First Name",
            "name": "first_name",
            "currentValue": "Already typed",
        }
        result = _rule_based([field], PROFILE)[0]
        self.assertIsNone(result["suggestedValue"])
        self.assertEqual(result["answerMode"], "existing")


if __name__ == "__main__":
    unittest.main()
