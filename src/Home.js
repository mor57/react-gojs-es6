import React, { Component } from "react";

const Breadcamp = props => <span> {props.pagetitle}</span>;
 const breadcamps=<div className="container-fluid margintop10">
  <div className="document-title">
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb">
        <li className="breadcrumb-item"><a href="#/">صفحه اصلی</a></li>
        <li className="breadcrumb-item" aria-current="page"><Breadcamp pagetitle="بیمه تهران" /></li>
      </ol>
    </nav>
  </div>
</div>
class Home extends Component {
  render() {
    return (
      breadcamps
    );
  }
}

export default Home;

