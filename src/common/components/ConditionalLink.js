import { Link } from 'react-router-dom';

const ConditionalLink = ({ children, to, condition }) => {
  if (!!condition && to) {
    return <Link to={to}>{children}</Link>;
  } else {
    return <>{children}</>;
  }
};

export default ConditionalLink;
