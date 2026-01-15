# IELTS Strategy Quiz Requirements

## Overview
This document outlines the business and technical requirements for the "IELTS Strategy Quiz" application.

## Part 1: Learning Strategy Assessment
(See previous sections for details)

## Part 2: Strengths & Weaknesses (Self-Assessment)

### 1. Goal
Identify specific problems the user faces in Listening and Reading skills to tailor future detailed advice.

### 2. Questions and Data Structure
- **Source**: Quiz content Part 2.
- **Structure**:
  - Two main categories: Listening and Reading.
  - Question Type: **Multiple Choice, Multiple Answer (Checkbox)**.
  - Users can select **all** options that apply to them.

### 3. Display Logic
- **Order**: Fixed order as categorized lists.

### 4. Scoring & Processing (Matching Rules)
- **Concept**: There is no numerical score for Part 2.
- **Logic**: Use the user's selected "Problems" to look up specific advice from the matching tables (`part2_recommendations.json`).
- **Data Source**: derived from `Listening_matching_rule.csv` and `Reading_matching_rule.csv`.
- **Mapping**:
  - Each selected **Problem** acts as a key.
  - One Problem may map to multiple **Question Types** (e.g., "Weak Vocabulary" affects Matching Headings, Multiple Choice, etc.).
  - For each match, display:
    - **Question Type**: The specific IELTS task impacted.
    - **Reason**: The underlying cause.
    - **Solution**: The recommended practice strategy.

## Implementation Guidelines
### Data Files
1. `part1_quiz.json`: Part 1 questions and scores.
2. `part2_quiz.json`: Part 2 survey questions.
3. `part2_recommendations.json`: (NEW) Lookup table for Part 2 advice.

### Logic Flow
1. User completes Part 2.
2. System iterates through selected answers (Problems).
3. System matches each Problem against the `recommendations` data.
### Output Presentation Format
For each problem selected by the user, provide a structured recommendation block:

**Problem:** [Restate the selected problem]  
**Reasoning:** [Reason from data]  
**Recommendation:**
*   **Solution/Strategy:** [Solution]
*   **Question Type to Practice:** [Question Type]

*Note: If a problem affects multiple question types, list all recommendations clearly under the problem.*

## 6. Final Result View & Lead Capture

### Display Logic
Upon completing both parts, the user sees a **consolidated results page**:
1.  **Part 1 Result**: Total score, Strategy Level (Color-coded), and General Analysis.
2.  **Part 2 Report**: The detailed "Problem -> Recommendation" list.

### Lead Capture & Call to Action
Below the results, present a form to "Get full results and the IELTS Cambridge Checklist via email":
*   **Fields**: Name, Email, Phone Number (All required).
*   **Incentive**: Mention they will receive the *Full Result Report* + *Checklist_IELTS_Cambridge.pdf*.
*   **Consultant Opt-in**:
    *   **UI**: A **prominent** checkbox or toggle.
    *   **Label**: "I want a free consultation for the Online IELTS Course" (or similar prominent text).
    *   **Default**: Unchecked (User must opt-in) or as specified by business logic (User requested "prominent", so design should highlight it).

### Action
*   **Submit Button**: "Send Results & Checklist".

## 7. Post-Submission Workflow (Backend)
Triggered upon form submission:

1.  **Send Email to Student**:
    *   **Content**: Full results from Part 1 & 2.
    *   **Attachment/Link**: [Checklist_IELTS_Cambridge.pdf](https://drive.google.com/file/d/1YlDC7x4VN71ooSc4sATSmHVfjzqWDKWm/view?usp=sharing).
2.  **Save to Data Store (Google Sheets)**:
    *   Log: Timestamp, Name, Email, Phone, Part 1 Score, Part 2 Problems, Opt-in Status.
3.  **Teacher Alert**:
    *   Notify the admin/teacher if the "Consultant Opt-in" is checked (or for all submissions, depending on volume).

## 8. Assets
- **PDF Resource**: [Download Link](https://drive.google.com/file/d/1YlDC7x4VN71ooSc4sATSmHVfjzqWDKWm/view?usp=sharing)
