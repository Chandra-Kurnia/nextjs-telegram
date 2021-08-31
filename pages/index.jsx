/* eslint-disable react-hooks/exhaustive-deps */
import {Fragment} from 'react';
import Head from 'next/head';
import styled, {createGlobalStyle} from 'styled-components';
import {useSelector} from 'react-redux';
import menu from '../public/assets/icons/menu.svg';
import Menu from '../components/organisms/Menu';
import {useState, useEffect} from 'react';
import SearchChat from '../components/molecules/SearchChat';
import CardChat from '../components/organisms/CardChat';
import CardChatProfile from '../components/organisms/CardChatProfile';
import ProfileImg from '../public/assets/img/profile.jpg';
import SendMsg from '../components/molecules/SendMsg';
import MsgBubblel from '../components/atoms/MsgBubblel';
import {io} from 'socket.io-client';
import {default as axios} from '../configs/axios';
import {useRouter} from 'next/router';
import swal from 'sweetalert';

const Globalstyle = createGlobalStyle`
body{
    font-family: rubix-regular;
}
`;

const Wrapper = styled.div`
  display: flex;
  position: relative;
  width: 100%;
`;

const Chats = styled.div`
  width: 100%;
  /* width: 50%; */
  background-color: white;
  padding: 40px;
  border-right: 1px solid #e5e5e5;
  position: relative;
  min-height: 100vh;

  @media (min-width: 768px) {
    width: 50%;
  }

  @media (min-width: 992px) {
    width: 25%;
  }
`;

const Chat = styled.div`
  /* width: 50%; */
  width: 100%;
  background-color: var(--bg-chat);
  height: 100vh;
  position: fixed;
  right: 0;
  overflow-y: auto;
  padding-bottom: 130px;

  @media (min-width: 768px) {
    width: 50%;
  }

  @media (min-width: 992px) {
    width: 75%;
  }
`;

const Textbanner = styled.h1`
  color: var(--primary);
  font-weight: bolder;
  font-family: raphtalia;
`;

const Banner = styled.div`
  display: flex;
  justify-content: space-between;
`;

const IMG = styled.img`
  cursor: pointer;
`;

const MSG = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 57vh;
  bottom: 130px;
  padding: 0px 30px;
  margin-top: 190px;
  width: 100%;
  @media (min-width: 768px) {
    padding: 0px 40px;
    min-height: 68vh;
  }

  @media (min-width: 992px) {
    padding: 0px 66px;
    min-height: 55vh;
  }
`;

export const getServerSideProps = async (ctx) => {
  try {
    const cookie = ctx.req.headers.cookie || '';
    const ResdataUser = await axios.get('/user/checktoken', {headers: {cookie}});
    const ResAllDataUser = await axios.get('/user/getallusers', {headers: {cookie}});
    const dataUser = ResdataUser.data.data;
    const datausers = ResAllDataUser.data.data;
    return {
      props: {
        dataUser,
        datausers,
        cookie,
      },
    };
  } catch (err) {
    // console.log(err);
    return {
      redirect: {
        permanent: false,
        destination: '/auth/login',
      },
      props: {
        err: 'Invalid credentials',
      },
    };
  }
};

const Index = (props) => {
  const user = props.dataUser;
  const users = props.datausers;
  const token = props.cookie;
  const [dropMenu, setdropMenu] = useState(0);
  const [message, setmessage] = useState();
  const [messages, setmessages] = useState([]);
  const [socket, setsocket] = useState();
  const [userInChat, setuserInChat] = useState();
  useEffect(() => {
    if (!socket) {
      const socket = io('http://localhost:4000', {
        query: {
          token: token
        }
      });
      setsocket(socket);
    }
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('msgFromBackEnd', (msg) => {
          setmessages((old) => {
            // if(userInChat.user_id == msg.sender_id){
              return [...old, msg];
            // }else{
            //   return [...old];
            // }
          })
      }
      );
    }
  }, [socket]);

  const handleSend = () => {
    {message && 
      socket.emit('sendmsg', {message, recipient_id: userInChat.user_id}, (cbBackend) => {
        console.log(cbBackend);
        setmessages((old) => {
          return [...old, cbBackend];
        })
      });
      setmessage('');
    }
  };

  const getMessages = async (user_id, token) => {
    try {
      const dataMessages = await axios.get(`messages/getmessages/${user_id}`, {headers: {token}});
      const userChat = await axios.get(`user/showbyid/${user_id}`);
      setuserInChat(userChat.data.data)
      setmessages(dataMessages.data.data);
    } catch (error) {
      swal('Error', 'Cant get data chat, please try again later', 'error');
    }
  };

  return (
    <Fragment>
      <Head>
        <title>Telegram | Home</title>
      </Head>
      <Globalstyle />
      <Wrapper>
        <Chats>
          <Banner>
            <Textbanner>FlyDove</Textbanner>
            <IMG src={menu.src} alt="menu-icon" onClick={() => (dropMenu === 0 ? setdropMenu(1) : setdropMenu(0))} />
          </Banner>
          {dropMenu === 1 && <Menu />}
          <SearchChat
            className="ms-0 ms-lg-4 ms-md-2 mt-3 mt-md-4 mt-lg-5"
            // onChange={(e) => console.log(e.target.value)}
            // clickPlus={() => console.log('plus click')}
          />
          {users &&
            users.map((user, index) => (
              <CardChat
                key={index}
                className="mt-3"
                name={user.name}
                count="7"
                LastChat="Why did you do that? Lorem, ipsum dolor sit amet consectetur adipisicing elit. Tenetur odio earum at?"
                active={user.online === 1 ? true : false}
                img={`${process.env.API_SERVER_URL}${user.avatar}`}
                onClick={() => getMessages(user.user_id)}
              />
            ))}
        </Chats>
        <Chat>
          {messages.length > 0 ? (
            <>
              <CardChatProfile name={userInChat.name} active={userInChat.online} img={`${process.env.API_SERVER_URL}${userInChat.avatar}`} />
              <MSG>
                {messages &&
                  messages.map((message, index) => (
                    <>
                    <MsgBubblel key={index} msg={message.message} user={user.user_id === message.sender_id} time={message.time}/>
                    </>
                  ))}
              </MSG>
              <SendMsg value={message} onChange={(e) => setmessage(e.target.value)} onSend={() => handleSend()} />
            </>
          ) : (
            'Please select a chat to start messaging'
          )}
        </Chat>
      </Wrapper>
    </Fragment>
  );
};

export default Index;