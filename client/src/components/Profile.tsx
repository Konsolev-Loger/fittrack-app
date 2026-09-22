import { useAuthStore } from "../store/authStore";

export const Profile = () => {
	const { user, logout } = useAuthStore();

	if (!user) return null;

	return (
		<div>
			<h2>Profile</h2>
			<p>ID: {user.id}</p>
			<p>Email: {user.email}</p>
			<p>Name: {user.name}</p>
			<button type="button" onClick={() => logout()}>
				Logout
			</button>
		</div>
	);
};
