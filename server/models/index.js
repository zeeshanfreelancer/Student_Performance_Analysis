/**
 * Import all models so Mongoose registers schemas before populate/ref usage.
 * Without this, populate('class') fails with "Schema hasn't been registered for model Class".
 */
import './User.js';
import './Department.js';
import './Class.js';
import './Subject.js';
import './Teacher.js';
import './Parent.js';
import './Student.js';
import './Attendance.js';
import './Assignment.js';
import './Quiz.js';
import './Result.js';
import './Chat.js';
import './Message.js';
import './Report.js';
import './File.js';
import './ActivityLog.js';
