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
