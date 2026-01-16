/**
 * IELTS Strategy Quiz - Backend Script
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Paste this code into Code.gs (delete existing code).
 * 4. Save the project.
 * 5. Deploy -> New Deployment -> Select "Web app".
 *    - Description: "v1"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 6. Copy the "Web App URL" and use it in your React frontend.
 */

// Configuration
const SCRIPT_PROP = PropertiesService.getScriptProperties();
const SHEET_NAME = 'Submissions';

function setup() {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = doc.getSheetByName(SHEET_NAME);

    // Create sheet if not exists
    if (!sheet) {
        sheet = doc.insertSheet(SHEET_NAME);
        // Header Row
        sheet.appendRow([
            'Timestamp',
            'Name',
            'Email',
            'Phone',
            'Part 1 Score',
            'Level',
            'Q1 Answer',
            'Q2 Answer',
            'Q3 Answer',
            'Q4 Answer',
            'Q5 Answer',
            'Q6 Answer',
            'Opt-In Consultation',
            'Analysis Report',
            'Study Plan Link',
            'Q1 Answer',
            'Q2 Answer',
            'Q3 Answer',
            'Q4 Answer',
            'Q5 Answer',
            'Q6 Answer'
        ]);
    }
}

function doPost(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const doc = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = doc.getSheetByName(SHEET_NAME);

        // Auto-setup if sheet doesn't exist
        if (!sheet) {
            setup();
            sheet = doc.getSheetByName(SHEET_NAME);
        }

        // Parse data
        // React fetch often sends as stringified JSON in the body
        let data;
        try {
            data = JSON.parse(e.postData.contents);
        } catch (err) {
            // Fallback for form-data if needed
            data = e.parameter;
        }

        const { name, email, phone, part1Score, level, levelTitle, levelDescription, recommendations, optIn, problems, answers, studyPlanLink } = data;
        const timestamp = new Date();

        // Generate Analysis Report Content
        const reportBody = generateReportBody(name, part1Score, level, levelTitle, levelDescription, recommendations);

        // 1. Save to Sheet
        sheet.appendRow([
            timestamp,
            name,
            email,
            phone,
            part1Score,
            level,
            optIn ? "Yes" : "No",
            reportBody,
            studyPlanLink || "",
            answers ? answers.q1 : "",
            answers ? answers.q2 : "",
            answers ? answers.q3 : "",
            answers ? answers.q4 : "",
            answers ? answers.q5 : "",
            answers ? answers.q6 : ""
        ]);

        // 2. Send Email to Student
        sendStudentEmail(email, reportBody);

        // 3. Send Alert to Teacher (if Opt-In)
        if (optIn) {
            // Problems summary for teacher quick view
            const problemsSummary = Array.isArray(problems) ? problems.join(', ') :
                (recommendations ? recommendations.map(r => r.problem).join(', ') : "");
            sendTeacherAlert(name, email, phone, level, problemsSummary);
        }

        return ContentService
            .createTextOutput(JSON.stringify({ "result": "success" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (e) {
        return ContentService
            .createTextOutput(JSON.stringify({ "result": "error", "error": e.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

function generateReportBody(name, score, level, levelTitle, levelDescription, recommendations) {
    // Format Part 2 Recommendations
    let part2Content = "";
    if (recommendations && recommendations.length > 0) {
        // Group by skill
        const listeningRecs = recommendations.filter(r => r.skill === 'Listening');
        const readingRecs = recommendations.filter(r => r.skill === 'Reading');

        if (listeningRecs.length > 0) {
            part2Content += "Với kỹ năng Listening:\n";
            listeningRecs.forEach(item => {
                part2Content += `\n* Vấn đề: ${item.problem}\n`;
                item.solutions.forEach(sol => {
                    part2Content += `  - Giải pháp: ${sol}\n`;
                });
                part2Content += `  - Dạng câu hỏi nên luyện: ${item.questionTypes.join(', ')}\n`;
            });
            part2Content += "\n";
        }

        if (readingRecs.length > 0) {
            part2Content += "Với kỹ năng Reading:\n";
            readingRecs.forEach(item => {
                part2Content += `\n* Vấn đề: ${item.problem}\n`;
                item.solutions.forEach(sol => {
                    part2Content += `  - Giải pháp: ${sol}\n`;
                });
                part2Content += `  - Dạng câu hỏi nên luyện: ${item.questionTypes.join(', ')}\n`;
            });
            part2Content += "\n";
        }
    } else {
        part2Content = "Không tìm thấy vấn đề cụ thể nào trong Phần 2.\n";
    }

    return `
Xin chào ${name},

Dưới đây là kết quả chi tiết từ bài Đánh giá Chiến lược IELTS của bạn tại iLearn:

=====================================
PHẦN 1 – CÁCH BẠN ĐANG HỌC IELTS LISTENING & READING
=====================================
Điểm số: ${score}/12
Cấp độ: ${level} | ${levelTitle || ""}

${levelDescription || ""}

=====================================
PHẦN 2 – ĐIỂM MẠNH & YẾU CỦA BẠN KHI HỌC IELTS LISTENING/READING
=====================================
Kết quả của bạn cho thấy:

${part2Content}
=====================================
BƯỚC TIẾP THEO GỢI Ý CHO BẠN
=====================================
Trong file Checklist IELTS Cambridge, bạn có thể:
* Tập trung giải các dạng bài còn yếu
* Thực hành theo quy trình các bước TRƯỚC - TRONG - SAU khi giải đề để có quy trình ôn luyện hiệu quả

Link tải tài liệu độc quyền: 
IELTS Cambridge Checklist: https://drive.google.com/file/d/1YlDC7x4VN71ooSc4sATSmHVfjzqWDKWm/view?usp=sharing

Chúc bạn ôn luyện hiệu quả!

Trân trọng,
Phuc Ha, iLearn Teacher
  `;
}

function sendStudentEmail(email, body) {
    const subject = "Kết quả Đánh giá Chiến lược IELTS & Checklist";
    MailApp.sendEmail({
        to: email,
        subject: subject,
        body: body,
        name: "Phuc Ha, iLearn Teacher"
    });
}

function sendTeacherAlert(name, email, phone, level, problems) {
    const teacherEmail = "tranlephucha@gmail.com";
    const subject = `[Lead] Yêu cầu Tư vấn Mới: ${name}`;
    const body = `
Học viên mới yêu cầu tư vấn:

Họ tên: ${name}
Email: ${email}
SĐT: ${phone}
Cấp độ: ${level}
Vấn đề: ${Array.isArray(problems) ? problems.join(', ') : problems}

Vui lòng liên hệ sớm.
  `;

    MailApp.sendEmail({
        to: teacherEmail,
        subject: subject,
        body: body
    });
}

// --- Debugging / Testing Function ---
function testEmail() {
    // Run this function from the dropdown to test email sending
    const testStudent = "Test User";
    const testEmail = "diepvic@gmail.com"; // Your email
    const testScore = 8;
    const testLevel = "Effective";
    const testLevelTitle = "BIẾT CÁCH LÀM, NHƯNG THIẾU HỆ THỐNG";
    const testLevelDescription = "Bạn đã hiểu rằng cần phân tích lại bài, nhưng chưa có quy trình ôn luyện hiệu quả và ổn định.";

    // Mock recommendations structure
    const testRecommendations = [
        {
            skill: "Listening",
            problem: "Không theo kịp tốc độ bài nói",
            solutions: ["Luyện nghe nhiều hơn", "Học thêm từ vựng"],
            questionTypes: ["Gap filling", "Multiple choice"]
        },
        {
            skill: "Reading",
            problem: "Tốc độ đọc còn chậm",
            solutions: ["Học thêm từ vựng", "Tăng cường luyện đọc"],
            questionTypes: ["Matching heading", "Which paragraph contains"]
        }
    ];

    const reportBody = generateReportBody(testStudent, testScore, testLevel, testLevelTitle, testLevelDescription, testRecommendations);
    Logger.log(`Sending test email to ${testEmail}...`);
    sendStudentEmail(testEmail, reportBody);
    Logger.log("Email sent! Check your inbox.");
}

function testSheetFromEditor() {
    // 1. Ensure sheet exists and has headers
    setup();

    // 2. Add a dummy row
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(SHEET_NAME);
    const timestamp = new Date();

    sheet.appendRow([
        timestamp,
        "Test Student via Editor",
        "test@example.com",
        "123456789",
        10,
        "Independent",
        "Yes",
        "Test Report Content",
        "https://example.com/study-plan",
        "Test Answer 1",
        "Test Answer 2",
        "Test Answer 3",
        "Test Answer 4",
        "Test Answer 5",
        "Test Answer 6"
    ]);

    Logger.log("Test row added to 'Submissions' sheet. Check your Google Sheet!");
}
