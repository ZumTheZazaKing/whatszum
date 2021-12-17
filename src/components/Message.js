export const Message = (props) => {

    const { body, sender, sentAt } = props.info;

    return <div className="message">
        <h2>{body}</h2>
    </div>
}