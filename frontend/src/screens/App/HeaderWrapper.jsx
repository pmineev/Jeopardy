import Header from "./Header";
import {Outlet} from "react-router-dom";
import React from "react";

const HeaderWrapper = () => {
    return (
        <>
            <Header/>
            <Outlet/>
        </>
    );
}

export default HeaderWrapper;