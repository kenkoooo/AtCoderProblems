import React from 'react';
import { Row } from 'reactstrap';

interface Props {
    user_ids: string[];
}

interface State { }

class UserPage extends React.Component<Props, State> {
    render() {
        return (<div>
            {this.props.user_ids.map(user => <h1 key={user}>{user}</h1>)}
        </div>);
    }
}

export default UserPage;