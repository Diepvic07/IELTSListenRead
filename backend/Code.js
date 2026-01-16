/**
 * IELTS Strategy Quiz - Backend Script
 * 
 * Version: 2.0 (Vietnamese Email Support)
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
    }

    // Add Header Row if sheet is empty
    if (sheet.getLastRow() === 0) {
        sheet.appendRow([
            'Timestamp',
            'Name',
            'Email',
            'Phone',
            'Part 1 Score',
            'Level',
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
        let data;
        try {
            data = JSON.parse(e.postData.contents);
        } catch (err) {
            data = e.parameter;
        }

        // Destructure Payload
        // Note: part2Analysis is the new object sent from frontend
        const {
            name, email, phone, part1Score, level, levelTitle, levelDescription,
            recommendations, part2Analysis, optIn, problems, answers, studyPlanLink
        } = data;

        const timestamp = new Date();

        // Generate Analysis Report Content (Vietnamese)
        const reportBody = generateReportBodyVN(name, part1Score, level, levelTitle, levelDescription, part2Analysis);

        // 1. Save to Sheet - Ensure robust handling of possibly missing answers
        // Prepare array relative to headers
        const rowData = [
            timestamp,
            name,
            email,
            phone,
            part1Score,
            level,
            optIn ? "Yes" : "No",
            reportBody,
            studyPlanLink || "",
            (answers && answers.q1) || "",
            (answers && answers.q2) || "",
            (answers && answers.q3) || "",
            (answers && answers.q4) || "",
            (answers && answers.q5) || "",
            (answers && answers.q6) || ""
        ];

        sheet.appendRow(rowData);

        // 2. Send Email to Student
        sendStudentEmail(email, reportBody);

        // 3. Send Alert to Teacher (if Opt-In)
        if (optIn) {
            // Problems string fallback
            const problemsText = problems ||
                (part2Analysis ? Object.values(part2Analysis).flatMap(s => s.topProblems).join(', ') : "") ||
                (recommendations ? recommendations.map(r => r.problem).join(', ') : "Không xác định");

            sendTeacherAlert(name, email, phone, level, problemsText);
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

function generateReportBodyVN(name, score, level, levelTitle, levelDescription, part2Analysis) {

    // -- Format Part 2 Analysis (Using Top 3 Lists) --
    let part2Content = "";

    if (!part2Analysis || (!part2Analysis.listening && !part2Analysis.reading)) {
        part2Content = "Chưa có dữ liệu phân tích chi tiết cho phần này.\n";
    } else {
        // Listening
        if (part2Analysis.listening && part2Analysis.listening.topProblems && part2Analysis.listening.topProblems.length > 0) {
            part2Content += "Với kỹ năng Listening:\n";
            part2Content += `03 vấn đề chính của bạn với kỹ năng Listening là:\n`;
            part2Analysis.listening.topProblems.forEach(p => part2Content += `+ ${p}\n`);

            part2Content += `\n03 giải pháp chính cho kỹ năng Listening:\n`;
            part2Analysis.listening.topSolutions.forEach(s => part2Content += `+ ${s}\n`);

            part2Content += `\n03 dạng bài Listening bạn cần tập trung nhiều nhất:\n`;
            part2Analysis.listening.topQuestionTypes.forEach(q => part2Content += `+ ${q}\n`);
            part2Content += "\n-------------------------------------\n\n";
        }

        // Reading
        if (part2Analysis.reading && part2Analysis.reading.topProblems && part2Analysis.reading.topProblems.length > 0) {
            part2Content += "Với kỹ năng Reading:\n";
            part2Content += `03 vấn đề chính của bạn với kỹ năng Reading là:\n`;
            part2Analysis.reading.topProblems.forEach(p => part2Content += `+ ${p}\n`);

            part2Content += `\n03 giải pháp cho kỹ năng Reading:\n`;
            part2Analysis.reading.topSolutions.forEach(s => part2Content += `+ ${s}\n`);

            part2Content += `\n03 dạng bài Reading bạn cần tập trung nhiều nhất:\n`;
            part2Analysis.reading.topQuestionTypes.forEach(q => part2Content += `+ ${q}\n`);
            part2Content += "\n";
        }
    }

    return `Xin chào ${name},

Dưới đây là kết quả chi tiết từ bài Đánh giá Chiến lược IELTS của bạn tại iLearn:

=====================================
PHẦN 1 – CÁCH BẠN ĐANG HỌC IELTS LISTENING & READING
=====================================
Điểm số: ${score}/12
Cấp độ: ${levelTitle || level}

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
+ Tập trung giải các dạng bài còn yếu
+ Thực hành theo quy trình các bước TRƯỚC - TRONG - SAU khi giải đề để có quy trình ôn luyện hiệu quả

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
Vấn đề chính: ${problems}

Vui lòng liên hệ sớm.
  `;

    MailApp.sendEmail({
        to: teacherEmail,
        subject: subject,
        body: body
    });
}
