"use client"
import { RiLogoutCircleRLine } from "react-icons/ri";
import { useRouter } from 'next/navigation'
import { BASE_URL } from "@/lib/constants";

const UserInfoLogout = ({title}: {title: string}) => {
    const router = useRouter();
    // const cookieStore = await cookies()
    // const user_info = cookieStore.get('user_info')
    // console.log(user_info, 'user_info ========== frontend');

    const handleLogout = async () => {
        await fetch(`${BASE_URL}/api/auth/logout`);
        router.push("/login");
    }

    return (
        <div className="flex flex-row items-center justify-around">
            <p></p>
            <h1 className="sm:text-3xl text-xl font-bold">{title}</h1>
            <button className="bg-red-400 hover:bg-red-500 duration-300 rounded-full p-2 text-white" onClick={handleLogout}>
            <RiLogoutCircleRLine />
            </button>
        </div>
    )
}

export default UserInfoLogout
