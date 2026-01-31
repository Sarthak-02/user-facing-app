import api from "./axios";


export async function loginApi({userid,password}){
     console.log(userid,password)
    try{
        let resp = await api.post("/login",{
            username:userid,password
        })
        
        return resp.data ;
    }
    catch(err){
        console.log(err.response.data)
        throw err.response.data
    }
}

export async function logoutApi() {
    try{
        await api.post("/logout")
    }
    catch(err){
        console.log(err.response.data)
        throw err.response.data
    }
}

export async function fetchTeacherPermissions(teacher_id) {
    try {
        const resp = await api.get(`/teacher/permissions`, {
            params: { teacher_id }
        });
        return resp.data;
    } catch (err) {
        console.log(err.response?.data);
        throw err.response?.data || err;
    }
}

export async function saveFCMToken({ userId, role, token }) {
    try {
        const resp = await api.post("/device-token/register", {
            user_id: userId,
            role,
            token,
            platform: "web"
        });
        return resp?.data || {};
    } catch (err) {
        console.log(err.response?.data);
        throw err.response?.data || err;
    }
}

export async function fetchStudentProfile(student_id) {
    try {
        const resp = await api.get(`/student/profile`, {
            params: { student_id }
        });
        return resp.data;
    } catch (err) {
        console.log(err.response?.data);
        throw err.response?.data || err;
    }
}

export async function fetchStaffProfile(staff_id) {
    try {
        const resp = await api.get(`/staff/profile`, {
            params: { staff_id }
        });
        return resp.data;
    } catch (err) {
        console.log(err.response?.data);
        throw err.response?.data || err;
    }
}

export async function updateStudentProfile(student_id, profileData) {
    try {
        const resp = await api.put(`/student/profile`, {
            student_id,
            ...profileData
        });
        return resp.data;
    } catch (err) {
        console.log(err.response?.data);
        throw err.response?.data || err;
    }
}

export async function updateStaffProfile(staff_id, profileData) {
    try {
        const resp = await api.put(`/staff/profile`, {
            staff_id,
            ...profileData
        });
        return resp.data;
    } catch (err) {
        console.log(err.response?.data);
        throw err.response?.data || err;
    }
}
