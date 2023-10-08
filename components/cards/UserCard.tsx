interface Props {
    id: string;
    name: string;
    username: string;
    imgUrl: string;
    personType: string;
}

function UserCard({
    id,
    name,
    username,
    imgUrl,
    personType,
}: Props) {
    return (
        <div>UserCard</div>
    )
}

export default UserCard