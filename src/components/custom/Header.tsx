import UserInfoLogout from "./UserInfoLogout"

const Header = ({title}: {title: string}) => {
  return (
    <header className="w-full py-5 rounded-b-3xl shadow-md z-10">
      <UserInfoLogout title={title} />
    </header>
  )
}

export default Header;