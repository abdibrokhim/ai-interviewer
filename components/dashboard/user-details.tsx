import { useUser } from "@/providers/user-provider";

export function UserDetails() {
    const { user } = useUser();
    console.log('user: ', user);
    
    if (!user) {
        return null;
    }

    return (
        <div>
            <h1>{user?.display_name}</h1>
            <p>{user?.email}</p>
            <p>{user?.created_at}</p>
            <p>{user?.last_active_at}</p>
        </div>
    )
}