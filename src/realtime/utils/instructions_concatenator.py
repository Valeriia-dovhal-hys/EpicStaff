def generate_instruction(role: str, goal: str, backstory: str) -> str:
    return (
        f"You are {role.strip()}. Your goal is to {goal.strip()}.\n\n"
        f"Background: {backstory.strip()}.\n\n"
        "Follow these guidelines:\n"
        "- Be clear and concise.\n"
        "- Stay relevant to the background.\n"
        "- Prioritize accuracy and logic.\n"
        "- Maintain a professional tone."
    )
