// Medical History Onboarding Questions
// Questions are asked in sequence, with follow-up questions based on answers

export interface Question {
    id: string;
    questionUrdu: string;
    questionEnglish: string;
    type: "text" | "select" | "multiselect" | "boolean" | "number";
    options?: { value: string; labelUrdu: string; labelEnglish: string }[];
    field: string; // Maps to MedicalHistory model field
    required: boolean;
    followUpQuestions?: {
        condition: (answer: any) => boolean;
        questions: Question[];
    };
}

export const medicalHistoryQuestions: Question[] = [
    // Basic Information
    {
        id: "greeting",
        questionUrdu: "السلام علیکم! میں آپ کا صحت معاون ہوں۔ آئیے پہلے آپ کی طبی تاریخ کے بارے میں جانتے ہیں۔ آپ کی عمر کیا ہے؟",
        questionEnglish: "Hello! I'm your health assistant. Let's first learn about your medical history. What is your age?",
        type: "number",
        field: "age",
        required: true,
    },
    {
        id: "gender",
        questionUrdu: "آپ کی جنس کیا ہے؟",
        questionEnglish: "What is your gender?",
        type: "select",
        field: "gender",
        options: [
            { value: "male", labelUrdu: "مرد", labelEnglish: "Male" },
            { value: "female", labelUrdu: "عورت", labelEnglish: "Female" },
            { value: "other", labelUrdu: "دیگر", labelEnglish: "Other" },
        ],
        required: true,
    },
    {
        id: "bloodGroup",
        questionUrdu: "اگر آپ کو معلوم ہو تو آپ کا بلڈ گروپ کیا ہے؟",
        questionEnglish: "What is your blood group, if you know?",
        type: "select",
        field: "bloodGroup",
        options: [
            { value: "A+", labelUrdu: "A+", labelEnglish: "A+" },
            { value: "A-", labelUrdu: "A-", labelEnglish: "A-" },
            { value: "B+", labelUrdu: "B+", labelEnglish: "B+" },
            { value: "B-", labelUrdu: "B-", labelEnglish: "B-" },
            { value: "AB+", labelUrdu: "AB+", labelEnglish: "AB+" },
            { value: "AB-", labelUrdu: "AB-", labelEnglish: "AB-" },
            { value: "O+", labelUrdu: "O+", labelEnglish: "O+" },
            { value: "O-", labelUrdu: "O-", labelEnglish: "O-" },
            { value: "unknown", labelUrdu: "معلوم نہیں", labelEnglish: "Don't know" },
        ],
        required: false,
    },
    {
        id: "weight",
        questionUrdu: "آپ کا وزن کتنا ہے (کلوگرام میں)؟",
        questionEnglish: "What is your weight (in kg)?",
        type: "number",
        field: "weight",
        required: false,
    },
    {
        id: "height",
        questionUrdu: "آپ کا قد کتنا ہے (سینٹی میٹر میں)؟",
        questionEnglish: "What is your height (in cm)?",
        type: "number",
        field: "height",
        required: false,
    },

    // Family History
    {
        id: "familyDiabetes",
        questionUrdu: "کیا آپ کے خاندان میں کسی کو شوگر (ذیابیطس) کی بیماری ہے؟",
        questionEnglish: "Does anyone in your family have diabetes (sugar disease)?",
        type: "boolean",
        field: "familyHistory.diabetes",
        required: true,
    },
    {
        id: "familyHeart",
        questionUrdu: "کیا آپ کے خاندان میں کسی کو دل کی بیماری ہے؟",
        questionEnglish: "Does anyone in your family have heart disease?",
        type: "boolean",
        field: "familyHistory.heartDisease",
        required: true,
    },
    {
        id: "familyHypertension",
        questionUrdu: "کیا آپ کے خاندان میں کسی کو بلڈ پریشر (ہائی بی پی) کی بیماری ہے؟",
        questionEnglish: "Does anyone in your family have high blood pressure?",
        type: "boolean",
        field: "familyHistory.hypertension",
        required: true,
    },
    {
        id: "familyCancer",
        questionUrdu: "کیا آپ کے خاندان میں کسی کو کینسر ہوا ہے؟",
        questionEnglish: "Has anyone in your family had cancer?",
        type: "boolean",
        field: "familyHistory.cancer",
        required: true,
    },

    // Personal Medical History
    {
        id: "chronicConditions",
        questionUrdu: "کیا آپ کو کوئی پرانی بیماری ہے؟ جیسے شوگر، دل کی بیماری، دمہ، یا کوئی اور؟",
        questionEnglish: "Do you have any chronic conditions? Like diabetes, heart disease, asthma, or any other?",
        type: "multiselect",
        field: "chronicConditions",
        options: [
            { value: "diabetes", labelUrdu: "شوگر/ذیابیطس", labelEnglish: "Diabetes" },
            { value: "hypertension", labelUrdu: "بلڈ پریشر", labelEnglish: "High Blood Pressure" },
            { value: "heart_disease", labelUrdu: "دل کی بیماری", labelEnglish: "Heart Disease" },
            { value: "asthma", labelUrdu: "دمہ", labelEnglish: "Asthma" },
            { value: "thyroid", labelUrdu: "تھائیرائیڈ", labelEnglish: "Thyroid" },
            { value: "kidney_disease", labelUrdu: "گردے کی بیماری", labelEnglish: "Kidney Disease" },
            { value: "liver_disease", labelUrdu: "جگر کی بیماری", labelEnglish: "Liver Disease" },
            { value: "none", labelUrdu: "کوئی نہیں", labelEnglish: "None" },
        ],
        required: true,
    },
    {
        id: "currentMedications",
        questionUrdu: "کیا آپ کوئی دوائی باقاعدگی سے لے رہے ہیں؟ اگر ہاں تو کون سی؟",
        questionEnglish: "Are you taking any medications regularly? If yes, which ones?",
        type: "text",
        field: "currentMedications",
        required: false,
    },
    {
        id: "allergies",
        questionUrdu: "کیا آپ کو کسی چیز سے الرجی ہے؟ جیسے کوئی دوائی، کھانا، یا کوئی اور چیز؟",
        questionEnglish: "Do you have any allergies? Like any medicine, food, or anything else?",
        type: "text",
        field: "allergies",
        required: false,
    },
    {
        id: "pastSurgeries",
        questionUrdu: "کیا آپ کا کبھی کوئی آپریشن ہوا ہے؟ اگر ہاں تو کون سا؟",
        questionEnglish: "Have you ever had any surgery? If yes, which one?",
        type: "text",
        field: "pastSurgeries",
        required: false,
    },

    // Lifestyle
    {
        id: "smokingStatus",
        questionUrdu: "کیا آپ سگریٹ نوشی کرتے ہیں؟",
        questionEnglish: "Do you smoke?",
        type: "select",
        field: "smokingStatus",
        options: [
            { value: "never", labelUrdu: "کبھی نہیں", labelEnglish: "Never" },
            { value: "former", labelUrdu: "پہلے کرتا تھا/تھی", labelEnglish: "Former smoker" },
            { value: "current", labelUrdu: "ہاں", labelEnglish: "Yes, currently" },
        ],
        required: true,
    },
    {
        id: "alcoholConsumption",
        questionUrdu: "کیا آپ الکوحل استعمال کرتے ہیں؟",
        questionEnglish: "Do you consume alcohol?",
        type: "select",
        field: "alcoholConsumption",
        options: [
            { value: "never", labelUrdu: "کبھی نہیں", labelEnglish: "Never" },
            { value: "occasional", labelUrdu: "کبھی کبھار", labelEnglish: "Occasionally" },
            { value: "regular", labelUrdu: "باقاعدگی سے", labelEnglish: "Regularly" },
        ],
        required: true,
    },

    // Closing
    {
        id: "closing",
        questionUrdu: "شکریہ! آپ کی طبی تاریخ محفوظ ہو گئی۔ اب آپ اپنی صحت کے بارے میں بات کر سکتے ہیں۔",
        questionEnglish: "Thank you! Your medical history has been saved. Now you can discuss your health concerns.",
        type: "text",
        field: "_closing",
        required: false,
    },
];

// Helper to get nested field value
export function getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

// Helper to set nested field value
export function setNestedValue(obj: any, path: string, value: any): any {
    const parts = path.split(".");
    const last = parts.pop()!;
    const target = parts.reduce((acc, part) => {
        if (!acc[part]) acc[part] = {};
        return acc[part];
    }, obj);
    target[last] = value;
    return obj;
}
