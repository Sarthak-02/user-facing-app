export const CLASS_TARGET_SCHEMA = [
    {
        label: "Select Class",
        value: [],
        multi: true,
        type: "class",
        required: true,
        options: [],
        placeholder: "Select Class",
        onChange: (value) => {
            console.log(value);
        },
    }   
]

export const SECTION_TARGET_SCHEMA = [
    {
        label: "Select Class",
        value: "",
        multi: false,
        type: "class",
        required: true,
        options: [],
        placeholder: "Select Class",
        onChange: (value) => {
            console.log(value);
        },
    },
    {
        label: "Select Section",
        value: [],
        multi: true,
        type: "section",
        required: true,
        options: [],
        placeholder: "Select Section",
        onChange: (value) => {
            console.log(value);
        },
    }
]

export const STUDENT_TARGET_SCHEMA = [
    {
        label: "Select Class",
        value: "",
        multi: false,
        type: "class",
        required: true,
        options: [],
        placeholder: "Select Class",
        onChange: (value) => {
            console.log(value);
        },
    },
    {
        label: "Select Section",
        value: "",
        multi: false,
        type: "section",
        required: true,
        options: [],
        placeholder: "Select Section",
        onChange: (value) => {
            console.log(value);
        },
    },
    {
        label: "Select Student",
        value: [],
        multi: true,
        type: "student",
        required: true,
        options: [],
        placeholder: "Select Student",
        onChange: (value) => {
            console.log(value);
        },
    }
]