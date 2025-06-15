--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Quiz; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Quiz" (
    quiz_id integer NOT NULL,
    created_by integer NOT NULL,
    title character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."Quiz" OWNER TO postgres;

--
-- Name: Quiz_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Quiz_quiz_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Quiz_quiz_id_seq" OWNER TO postgres;

--
-- Name: Quiz_quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Quiz_quiz_id_seq" OWNED BY public."Quiz".quiz_id;


--
-- Name: SinglePlayResult; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SinglePlayResult" (
    result_id integer NOT NULL,
    user_id integer,
    quiz_id integer,
    total_questions integer NOT NULL,
    solved integer NOT NULL,
    correct integer NOT NULL,
    wrong integer NOT NULL,
    time_limited boolean NOT NULL,
    hint_enabled boolean NOT NULL,
    hint_count integer DEFAULT 0,
    played_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public."SinglePlayResult" OWNER TO postgres;

--
-- Name: SinglePlayResult_result_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SinglePlayResult_result_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SinglePlayResult_result_id_seq" OWNER TO postgres;

--
-- Name: SinglePlayResult_result_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SinglePlayResult_result_id_seq" OWNED BY public."SinglePlayResult".result_id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    user_id integer NOT NULL,
    username character varying(50),
    email character varying(100) NOT NULL,
    password character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    sns_id character varying(255),
    sns_provider character varying(50),
    auth_type character varying(20) NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_user_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_user_id_seq" OWNER TO postgres;

--
-- Name: User_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_user_id_seq" OWNED BY public."User".user_id;


--
-- Name: question; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question (
    question_id integer NOT NULL,
    quiz_id integer NOT NULL,
    type text,
    text_content text,
    media_url text,
    answer text NOT NULL,
    CONSTRAINT question_quiz_type_check CHECK ((type = ANY (ARRAY['text'::text, 'image'::text, 'sound'::text])))
);


ALTER TABLE public.question OWNER TO postgres;

--
-- Name: question_question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_question_id_seq OWNER TO postgres;

--
-- Name: question_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_question_id_seq OWNED BY public.question.question_id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    title text NOT NULL,
    password text,
    max_players integer NOT NULL,
    quiz_id integer NOT NULL,
    question_count integer NOT NULL,
    use_hint boolean DEFAULT true,
    use_timer boolean DEFAULT true,
    created_by text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    current_players integer DEFAULT 0
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_id_seq OWNER TO postgres;

--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: Quiz quiz_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quiz" ALTER COLUMN quiz_id SET DEFAULT nextval('public."Quiz_quiz_id_seq"'::regclass);


--
-- Name: SinglePlayResult result_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SinglePlayResult" ALTER COLUMN result_id SET DEFAULT nextval('public."SinglePlayResult_result_id_seq"'::regclass);


--
-- Name: User user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN user_id SET DEFAULT nextval('public."User_user_id_seq"'::regclass);


--
-- Name: question question_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question ALTER COLUMN question_id SET DEFAULT nextval('public.question_question_id_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Name: Quiz Quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quiz"
    ADD CONSTRAINT "Quiz_pkey" PRIMARY KEY (quiz_id);


--
-- Name: SinglePlayResult SinglePlayResult_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SinglePlayResult"
    ADD CONSTRAINT "SinglePlayResult_pkey" PRIMARY KEY (result_id);


--
-- Name: User User_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (user_id);


--
-- Name: User User_sns_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_sns_id_key" UNIQUE (sns_id);


--
-- Name: question question_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT question_pkey PRIMARY KEY (question_id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: Quiz Quiz_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quiz"
    ADD CONSTRAINT "Quiz_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."User"(user_id);


--
-- Name: SinglePlayResult SinglePlayResult_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SinglePlayResult"
    ADD CONSTRAINT "SinglePlayResult_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES public."Quiz"(quiz_id) ON DELETE CASCADE;


--
-- Name: SinglePlayResult SinglePlayResult_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SinglePlayResult"
    ADD CONSTRAINT "SinglePlayResult_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

