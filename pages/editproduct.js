import React, { useEffect, useState, useCallback } from "react";
import { Heading, Button, Modal, TextField, RadioButton, Stack, DropZone, Thumbnail, Caption, Checkbox, Select } from "@shopify/polaris";

const urlBase = "https://d65c-75-187-144-202.ngrok.io";

class Subtype extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    }

    this.doToggle = this.doToggle.bind(this);
  }

  doToggle() {
    this.setState({
      isOpen: !this.state.isOpen
    })
  }

  render() {
    return (
      <div className={this.state.isOpen ? "isOpen" : "closed"}>
        <div className="subtype line-item">
        <Button onClick={() => this.doToggle()}>&#8595;</Button>
        <p className="label">{this.props.name}</p>
        <Button onClick={() => this.props.parent.toggleModal("pricegroup", this.props.id)}>Add Price Group</Button>
        <Button onClick={() => {
          this.props.parent.doDelete(this.props.id, "subtype")
        }}>Delete</Button>
        </div>
        {this.props.children}
      </div>
    )
  }
}

class PriceGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    }

    this.doToggle = this.doToggle.bind(this);
  }

  doToggle() {
    this.setState({
      isOpen: !this.state.isOpen
    })
  }

  render() {
    return (
      <div className={this.state.isOpen ? "isOpen" : "closed"}>
        <div className="price-group line-item">
        <Button onClick={() => this.doToggle()}>&#8595;</Button>
      <p className="label">{this.props.name} - Price Level {this.props.priceLevel} | Surcharge: {this.props.surcharge}</p>
      <Button onClick={() => this.props.parent.toggleModal("swatch", this.props.id)}>Add Swatch</Button>
      <Button onClick={() => this.props.parent.openOptions(this.props.id)}>Options</Button>
      <Button onClick={() => {
        this.props.parent.doDelete(this.props.id, "pricegroup")
      }}>Delete</Button>
    </div>
    {this.props.children}
      </div>
    )
  }
}

const Swatch = ((props) => {
  let urlString = "url(" + urlBase + "/public/sw_" + props.internalId + ".jpg)";
  return (
    <div className="swatch line-item">
      <div className="swatch-img" style={{ backgroundImage: urlString }}></div>
      <p className="label">{props.name}</p>
      <Button onClick={() => {
        props.parent.doDelete(props.realId, "swatch")
      }}>Delete</Button>
    </div>
  )
})

const FileUploader = ((props) => {
  const [files, setFiles] = useState([]);

  const handleDropZoneDrop = (_dropFiles, acceptedFiles, _rejectedFiles) => {
    setFiles((files) => [...files, ...acceptedFiles]);
    props.parent.setState({
      files: acceptedFiles
    })
  }

  const validImageTypes = ['image/gif', 'image/jpeg', 'image/png'];

  const fileUpload = !files.length && <DropZone.FileUpload />;
  const uploadedFiles = files.length > 0 && (
    <Stack vertical>
      {files.map((file, index) => (
        <Stack alignment="center" key={index}>
          <Thumbnail
            size="small"
            alt={file.name}
            source={
              validImageTypes.includes(file.type)
                ? window.URL.createObjectURL(file)
                : NoteMinor
            }
          />
          <div>
            {file.name} <Caption>{file.size} bytes</Caption>
          </div>
        </Stack>
      ))}
    </Stack>
  );

  return (
    <DropZone onDrop={handleDropZoneDrop}>
      {uploadedFiles}
      {fileUpload}
    </DropZone>
  );
})

const PopupModal = ((props) => {
  const [value, setValue] = useState('disabled');

  const handleChange = useCallback(
    (_checked, newValue) => setValue(newValue),
    [],
  );
  switch (props.parent.state.actionType) {
    case "subtype":
      return (
        <Modal
          open={props.parent.state.open}
          title="Add Subtype"
          onClose={() => props.parent.toggleModal()}
          primaryAction={{
            content: 'Submit',
            onAction: props.parent.doSubmit,
          }}
        >
          <TextField
            label="Subtype Name"
            value={props.parent.state.fields[0]}
            onChange={(x) => props.parent.changeFields(x, 0)}
          />
        </Modal>
      )
      break;
    case "pricegroup":
      let options = [{label: 'None', value: '0'}];
      props.parent.state.prodInfo.subtypes.map((x) => {
        x.priceGroups.map((y) => {
          options.push({label: y.name, value: `${y.id}`})
        })
      })
      return (
        <Modal
          open={props.parent.state.open}
          title="Add Price Group"
          onClose={() => props.parent.toggleModal()}
          primaryAction={{
            content: 'Submit',
            onAction: props.parent.doSubmit,
          }}
        >
          <Select 
            label="Duplicate Settings"
            options={options}
            value={props.parent.state.fields[3]}
            onChange={(x) => props.parent.changeFields(x, 3)}
          />
          <TextField
            label="Price Group Name"
            value={props.parent.state.fields[0]}
            onChange={(x) => props.parent.changeFields(x, 0)}
          />
          <TextField
            label="Price Level"
            value={props.parent.state.fields[1]}
            onChange={(x) => props.parent.changeFields(x, 1)}
          />
          <TextField
            label="Surcharge"
            value={props.parent.state.fields[2]}
            onChange={(x) => props.parent.changeFields(x, 2)}
          />
        </Modal>
      )
      break;
    case "swatch":
      return (
        <Modal
          open={props.parent.state.open}
          title="Add Swatch"
          onClose={() => props.parent.toggleModal()}
          primaryAction={{
            content: 'Submit',
            onAction: props.parent.doSubmit,
          }}
        >
          <TextField
            label="Swatch Name"
            value={props.parent.state.fields[0]}
            onChange={(x) => props.parent.changeFields(x, 0)}
          />
          <FileUploader parent={props.parent} />
        </Modal>
      )
      break;
    case "pricegrid":
      return (
        <Modal
          open={props.parent.state.open}
          title="Add Price Grid"
          onClose={() => props.parent.toggleModal()}
          primaryAction={{
            content: 'Submit',
            onAction: props.parent.doSubmit,
          }}
        >
          <Checkbox
            label="MSRP?"
            checked={props.parent.state.fields[6]}
            onChange={(x) => props.parent.changeFields(x, 6)}
          />
          <TextField
            label="Grid"
            value={props.parent.state.fields[0]}
            onChange={(x) => props.parent.changeFields(x, 0)}
            multiline={20}
          />
        </Modal>
      )
    case "grid-surcharge":
      return (
        <Modal
          open={props.parent.state.open}
          title="Add Grid Surcharge"
          onClose={() => props.parent.toggleModal()}
          primaryAction={{
            content: 'Submit',
            onAction: props.parent.doSubmit,
          }}
        >
          <TextField
            label="Surcharge Name"
            value={props.parent.state.fields[1]}
            onChange={(x) => props.parent.changeFields(x, 1)}
          />
          <TextField
            label="Grid"
            value={props.parent.state.fields[2]}
            onChange={(x) => props.parent.changeFields(x, 2)}
            multiline={20}
          />
        </Modal>
      )
      break;
    case "line-surcharge":
      return (
        <Modal
          open={props.parent.state.open}
          title="Add Line Surcharge"
          onClose={() => props.parent.toggleModal()}
          primaryAction={{
            content: 'Submit',
            onAction: props.parent.doSubmit,
          }}
        >
          <TextField
            label="Surcharge Name"
            value={props.parent.state.fields[3]}
            onChange={(x) => props.parent.changeFields(x, 3)}
          />
          <Checkbox
            label="Percentage?"
            helpText="Check if this is a percentage-based surcharge"
            checked={props.parent.state.fields[5]}
            onChange={(x) => props.parent.changeFields(x, 5)}
          />
          <Checkbox
            label="Allow quantity?"
            helpText="Check to allow customers to order multiple"
            checked={props.parent.state.fields[7]}
            onChange={(x) => props.parent.changeFields(x, 7)}
          />
          <TextField
            label="Surcharge Value"
            value={props.parent.state.fields[6]}
            onChange={(x) => props.parent.changeFields(x, 6)}
          />
        </Modal>
      )
      break;
    case "surcharge-group":
      return (
        <Modal
          open={props.parent.state.open}
          title="Add Surcharge Group"
          onClose={() => props.parent.toggleModal()}
          primaryAction={{
            content: 'Submit',
            onAction: props.parent.doSubmit,
          }}
        >
          <TextField
            label="Group Name"
            value={props.parent.state.fields[6]}
            onChange={(x) => props.parent.changeFields(x, 6)}
          />
          <Checkbox
            label="Choose many?"
            checked={props.parent.state.fields[7]}
            helpText="Check if customer can choose multiple charges from this group"
            onChange={(x) => props.parent.changeFields(x, 7)}
          />
        </Modal>
      )
      break;
    default:
      return null;
  }
})

const Main = ((props) => {
  console.log(props);
  if (props.prodInfo) {
    if (props.parent.state.optionsOpen == false) {
      return (
        <React.Fragment>
          {props.prodInfo.subtypes.map((x) => {
            return (
                <Subtype parent={props.parent} name={x.name} key={x.id} id={x.id} props={props} children={
                  x.priceGroups.map(n => {
                    return (
                        <PriceGroup parent={props.parent} surcharge={n.surcharge} name={n.name} priceLevel={n.priceLevel} key={n.id} id={n.id} groups={x.priceGroups} children={
                          n.swatches.map(y => {
                            return <Swatch parent={props.parent} name={y.name} key={y.id} id={n.id} internalId={y.dup_id ? y.dup_id : y.id} realId={y.id} />
                          })
                        } />
                    )
                  })
                }>
                </Subtype>
            )
          })}
        </React.Fragment>
      )
    } else {
      return <EditOptions parent={props.parent} />
    }
  } else {
    return (<p>No data found</p>);
  }

})

const EditOptions = ((props) => {
  let priceGrids = props.parent.state.prodInfo.subtypes[props.parent.state.pgIds[0]].priceGroups[props.parent.state.pgIds[1]].pricegrids;
  let priceGridTable = false;
  let msrpTable = false;
  for (let i = priceGrids.length - 1; i > -1; i--) {
    if (priceGrids[i].msrp == true) {
      msrpTable = JSON.parse(priceGrids[i].grid)
    } else {
      priceGridTable = JSON.parse(priceGrids[i].grid)
    }
    if (priceGridTable && msrpTable) {
      break;
    }
  }
  console.log(priceGridTable, msrpTable)
  let surchargeGroups = props.parent.state.prodInfo.subtypes[props.parent.state.pgIds[0]].priceGroups[props.parent.state.pgIds[1]].surchargeGroups;
  return (
    <React.Fragment>
      <div className="grid-cont">
        <div className="upper-bar">
          <h2>{props.parent.state.prodInfo.subtypes[props.parent.state.pgIds[0]].name} / {props.parent.state.prodInfo.subtypes[props.parent.state.pgIds[0]].priceGroups[props.parent.state.pgIds[1]].name} / Options</h2>
          <Button onClick={() => props.parent.toggleModal("pricegrid", props.parent.state.fieldId)}>Upload</Button>
          <Button onClick={() => props.parent.setState({ optionsOpen: false })}>Close</Button>
        </div>
        <div className="inner-grid">
          { }
          <DisplayTable
            parent={props.parent}
            table={msrpTable ? msrpTable : null}
            msrp={true}
          />
          <DisplayTable
            parent={props.parent}
            table={priceGridTable ? priceGridTable : null}
          />
        </div>
      </div>
      <div className="grid-cont">
        <div className="upper-bar">
          <h2>Surcharge Groups</h2>
          <Button onClick={() => props.parent.toggleModal("surcharge-group", props.parent.state.fieldId)}>Add</Button>
        </div>
        <div className="inner-grid">
          {
            surchargeGroups ?
              surchargeGroups.map((x, i) => {
                return (
                  <div className="surcharge grid-cont">
                    <h2>{surchargeGroups[i].name}</h2>
                    <span>Allow multiple: {surchargeGroups[i].allowMultiple ? "True" : "False"}</span>
                    <Button onClick={() => {
                      props.parent.doDelete(surchargeGroups[i].id, "surcharge-group")
                    }}>Delete</Button>
                    <div className="grid-cont">
                      <div className="upper-bar">
                        <h2>Grid-Based Surcharges</h2>
                        <Button onClick={() => {
                          props.parent.toggleModal("grid-surcharge", props.parent.state.fieldId)
                          props.parent.setState({
                            sgId: surchargeGroups[i].id
                          })
                        }}>Add</Button>
                      </div>
                      <div className="inner-grid">
                        {
                          surchargeGroups[i].gridSurcharges ?
                            surchargeGroups[i].gridSurcharges.map((x, i) => {
                              return (
                                <React.Fragment>
                                  <Button onClick={() => {
                                    props.parent.doDelete(x.id, "grid-surcharge")
                                  }}>Delete</Button>
                                  <DisplayTable
                                    parent={props.parent}
                                    table={x ? JSON.parse(x.grid) : null}
                                    name={x.name}
                                  />
                                </React.Fragment>

                              )
                            })
                            :
                            <p>No surcharges for this product</p>
                        }
                      </div>
                    </div>
                    <div className="grid-cont">
                      <div className="upper-bar">
                        <h2>Line Item Surcharges</h2>
                        <Button onClick={() => {
                          props.parent.toggleModal("line-surcharge", props.parent.state.fieldId)
                          props.parent.setState({
                            sgId: surchargeGroups[i].id
                          })
                        }}>Add</Button>
                      </div>
                      <div className="inner-grid">
                        {
                          surchargeGroups[i].lineSurcharges ?
                            surchargeGroups[i].lineSurcharges.map((x, i) => {
                              return (
                                <div className="surcharge price-group line-item">
                                  <Button onClick={() => {
                                    props.parent.doDelete(x.id, "line-surcharge")
                                  }}>Delete</Button>
                                  <span className="line-name">{x.name}&nbsp;-&nbsp;
                                    {x.value}{x.type == 'true' ? '%' : '$'}
                                    &nbsp;| Allow quantity? {x.quantity ? "True" : "False"}</span>
                                </div>
                              )
                            })
                            :
                            <p>No surcharges for this product</p>
                        }
                      </div>
                    </div>
                  </div>
                )
              })
              :
              <p>No surcharges for this product</p>
          }
        </div>
      </div>
    </React.Fragment>
  )
})

const DisplayTable = ((props) => {
  if (props.table) {
    return (
      <React.Fragment>
        {props.name ? props.name : ""}
        <h2>{props.msrp ? "MSRP" : "WBS"}</h2>
        <table className={props.msrp ? "msrp" : "wbs"}>
          <thead>
            <tr>
              <th>
              </th>
              {
                props.table.cols.map((x) => {
                  return (<th className="col-title">{x}</th>)
                })
              }
            </tr>
          </thead>
          <tbody>
            {
              props.table.rows.map((y, i) => {
                return (
                  <tr>
                    <td className="row-title">
                      {y}
                    </td>
                    {
                      props.table.cells[i].map((x) => {
                        return (
                          <td>
                            {x}
                          </td>
                        )
                      })
                    }
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </React.Fragment>
    )
  } else {
    if (props.msrp) {
      return (<p>No MSRP table added</p>)
    } else {
      return (<p>No price table added</p>)
    }
  }
})

class EditProduct extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      prodInfo: null,
      prodId: null,
      actionType: "subtype",
      fieldId: null,
      subId: null,
      pgId: null,
      sgId: null,
      optionsOpen: false,
      pgIds: [], //delete this maybe
      fields: ["", "", "", "", "", false, false, false, false, "", 0],
      files: null
    }
    this.toggleModal = this.toggleModal.bind(this)
    this.doSubmit = this.doSubmit.bind(this)
    this.changeFields = this.changeFields.bind(this)
    this.doPost = this.doPost.bind(this)
    this.getProdInfo = this.getProdInfo.bind(this)
    this.openOptions = this.openOptions.bind(this)
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps !== this.props || nextState !== this.state) {
      return true;
    } else {
      return false;
    }
  }

  async componentDidMount() {
    this.getProdInfo();
  }

  componentDidUpdate() {
    if (this.props.product.id.substring(22, this.props.product.id.length) !== this.state.prodId) {
      this.getProdInfo();
    }
  }

  async getProdInfo() {
    let parsedId = this.props.product.id.substring(22, this.props.product.id.length);
    let res = await fetch(urlBase + "/product/" + parsedId);
    let json = await res.json();

    console.log(json)

    this.setState({
      prodInfo: json,
      prodId: parsedId
    })
  }


  toggleModal(type, id) {
    this.setState({
      open: !this.state.open,
      actionType: type,
      fieldId: id
    })
  }

  openOptions(id) {
    let subId, subIndex, pgIndex, pgId;
    for (let i = 0; i < this.state.prodInfo.subtypes.length; i++) {
      for (let x = 0; x < this.state.prodInfo.subtypes[i].priceGroups.length; x++) {
        if (this.state.prodInfo.subtypes[i].priceGroups[x].id == id) {
          subId = this.state.prodInfo.subtypes[i].id;
          pgId = this.state.prodInfo.subtypes[i].priceGroups[x].id;
          subIndex = i;
          pgIndex = x;
        }
      }
    }
    this.setState({
      optionsOpen: true,
      fieldId: id,
      pgIds: [subIndex, pgIndex],
      subId: subId,
      pgId: pgId
    })
  }

  async doSubmit() {
    this.toggleModal();
    let url, res, body;
    let type = this.state.actionType;
    switch (type) {
      case "subtype":
        url = "/product/" + this.state.prodId + "/subtype";
        body = this.state.fields[0];
        break;
      case "pricegroup":
        if (this.state.fields[3] !== '') {
          url = "/product/" + this.state.prodId + "/subtype/" + this.state.fieldId + "/pricegroup/" + this.state.fields[3] + "/dup";
        } else {
          url = "/product/" + this.state.prodId + "/subtype/" + this.state.fieldId + "/pricegroup";
        }
        let surcharge = this.state.fields[2].length > 1 ? this.state.fields[2] : 0;
        body = {
          name: this.state.fields[0],
          priceLevel: this.state.fields[1],
          surcharge: surcharge
        }
        
        break;
      case "swatch":
        url = "/product/" + this.state.prodId + "/subtype/" + this.state.fieldId + "/pricegroup/" + this.state.fieldId + "/swatch/";
        body = { file: this.state.files }
        break;
      case "pricegrid":
        let msrp = this.state.fields[6]
        url = "/product/" + this.state.prodId + "/subtype/" + this.state.subId + "/pricegroup/" + this.state.pgId + "/pricegrid/" + msrp;
        body = this.state.fields[0];
        break;
      case "grid-surcharge":
        url = "/product/" + this.state.prodId + "/subtype/" + this.state.subId + "/pricegroup/" + this.state.pgId + "/surcharge-group/" + this.state.sgId + "/grid-surcharge";
        body = {
          name: this.state.fields[1],
          datatable: this.state.fields[2]
        };
        break;
      case "line-surcharge":
        url = "/product/" + this.state.prodId + "/subtype/" + this.state.subId + "/pricegroup/" + this.state.pgId + "/surcharge-group/" + this.state.sgId + "/line-surcharge";
        body = {
          name: this.state.fields[3],
          type: this.state.fields[5],
          value: this.state.fields[6],
          quantity: this.state.fields[7]
        }
        break;
      case "surcharge-group":
        url = "/product/" + this.state.prodId + "/subtype/" + this.state.subId + "/pricegroup/" + this.state.pgId + "/surcharge-group";
        body = {
          name: this.state.fields[6],
          allowMultiple: this.state.fields[7]
        }
        break;
    }
    const makeBody = async body => new Promise((resolve, reject) => {
      if (body.file) {
        makeFiles(body.file).then((x) => {
          resolve(x);
        })
      } else {
        resolve(body)
      }
    })

    const makeFiles = async (f) => {
        let files = f.map((x, i) => {
          const reader = new FileReader();
          return new Promise(resolve => {
            reader.onload = () => resolve({file: reader.result, name: x.name.slice(0, (x.name.length - 4))});
            reader.readAsDataURL(x);
          })
        })
        let res = await Promise.all(files)
        return res
    }

    makeBody(body).then((x) => {
      console.log(x)
      this.doPost(url, x, type);
    });
  }

  async doPost(url, body, type) {
    let formatBody, contentType;
    if (type == "pricegrid") {
      contentType = "text/plain";
      formatBody = body;
    } else if (type == "grid-surcharge" || type == "line-surcharge" || type == "surcharge-group" || type == "pricegroup") {
      contentType = "application/json";
      formatBody = JSON.stringify(body);
    } else if (type == "swatch") {
      contentType = "application/json";
      formatBody = {
        files: body
      }
      console.log(formatBody)
      formatBody = JSON.stringify(formatBody);
    } else {
      formatBody = JSON.stringify(body);
      contentType = "text/plain";
    }

    console.log(formatBody, contentType, type)
    let response = await fetch(urlBase + url, {
      method: 'POST',
      headers: {
        'Content-Type': contentType
      },
      body: formatBody
    })
      .catch((error) => {
        console.error('Error:', error);
      })
      .then(() => {
        this.getProdInfo();
      })

  }

  async doDelete(id, type) {
    console.log(urlBase + "/" + type + "/" + id);
    let response = await fetch(urlBase + "/" + type + "/" + id, {
      method: 'DELETE',
      headers: {
        'Content-Type': "application/json"
      },
      body: { id: id }
    })
      .catch((error) => {
        console.error('Error:', error);
      })
      .then(() => {
        this.getProdInfo();
      })
  }

  changeFields(x, i) {
    let newFields = this.state.fields;
    newFields[i] = x;
    this.setState({
      fields: newFields
    })
  }

  render() {
    return (
      <React.Fragment>
        <div className="top">
          <Heading>{this.props.product.title}</Heading>
          <Button onClick={() => this.toggleModal("subtype", this.state.prodId)}>Add Subtype</Button>
        </div>
        <div className="main">
          <Main
            prodInfo={this.state.prodInfo}
            parent={this}
          />
        </div>

        <PopupModal parent={this} />
      </React.Fragment>
    )
  }

}

export default EditProduct;