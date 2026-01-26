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
        await api.get("/logout")
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
        return resp.data;
    } catch (err) {
        console.log(err.response?.data);
        throw err.response?.data || err;
    }
}
