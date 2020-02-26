import React, { Component } from 'react';
import PubSub from 'pubsub-js';
import { Link } from 'react-router-dom';

import {
  Table,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Alert
} from 'reactstrap';

class FormProduct extends Component {

  state = {
    produto: {
      id_produto: 0,
      nome: '',
      preco: 0
    }
  };

  setValues = (e, field) => {
    const { produto } = this.state;
    produto[field] = e.target.value;
    this.setState({ produto });
  }

  create = () => {
    this.setState({
      produto: {
        id_produto: 0,
        nome: '',
        preco: 0
      }
    })
    this.props.produtoCreate(this.state.produto);
  }

  componentWillMount() {
    PubSub.subscribe('edit-produto', (topic, produto) => {
      this.setState({ produto })
    });
  }

  render() {
    return (
      <Form>
        <FormGroup>
          <Label for="nome">Nome:</Label>
          <Input id="nome" type="text" value={this.state.produto.nome} placeholder="Nome do Produto..."
            onChange={e => this.setValues(e, 'nome')} />
        </FormGroup>
        <FormGroup>
          <div className="form-row">
            <div className="col-md-6">
              <Label for="preco">Preço:</Label>
              <Input id="preco" type="text" value={this.state.produto.preco} placeholder="R$"
                onChange={e => this.setValues(e, 'preco')} />
            </div>
          </div>
        </FormGroup>
        <Button color="primary" block onClick={this.create}> Gravar </Button>
      </Form>
    );
  }
}

class ListProduct extends Component {

  delete = (id_produto) => {
    this.props.deleteProduct(id_produto);
  }

  onEdit = (produto) => {
    PubSub.publish('edit-produto', produto);
  }

  render() {
    const { produtos } = this.props;
    return (
      <Table className="table-bordered text-center">
        <thead className="thead-dark">
          <tr>
            <th>Nome</th>
            <th>Preco</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {
            produtos.map(produto => (
              <tr key={parseInt(produto.id_produto)}>
                <td>{produto.nome}</td>
                <td>{produto.preco}</td>
                <td>
                  <Button color="info" size="sm" onClick={e => this.onEdit(produto)}>Editar</Button>
                  <Button color="danger" size="sm" onClick={e => this.delete(produto.id_produto)}>Deletar</Button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </Table>
    );
  }
}

export default class Dashboard extends Component {

  Url = 'http://localhost:9000/produtos'

  state = {
    produtos: [],
    message: {
      text: '',
      alert: ''
    }
  }

  componentDidMount() {
    fetch(this.Url)
      .then(response => response.json())
      .then(produtos => this.setState(produtos))
      .catch(e => console.log(e));
  }

  save = (produto) => {
    let data = {
      id_produto: parseInt(produto.id_produto),
      nome: produto.nome,
      preco: parseFloat(produto.preco)
    };

    const requestInfo = {
      method: data.id_produto !== 0 ? 'PUT' : 'POST',
      body: JSON.stringify(data),
      headers: new Headers({
        'Content-type': 'application/json',
      })
    };

    if (data.id_produto === 0) {
      // CREATE NEW PRODUCT
      fetch(this.Url, requestInfo)
        .then(response => response.json())
        .then(newProduto => {
          let { produtos } = this.state;
          produtos.push(newProduto);
          this.setState({ produtos, message: { text: 'Novo produto adicionado com sucesso!', alert: 'success' } });
          this.timerMessage(3000);

        })
        .catch(e => console.log(e));
    } else {
      // EDIT PRODUCT
      fetch(`${this.Url}/${data.id_produto}`, requestInfo)
        .then(response => response.json())
        .then(updateProduto => {
          let { produtos } = this.state;
          let position = produtos.findIndex(produto => produto.id_produto === data.id_produto);
          produtos[position] = updateProduto;
          this.setState({ produtos, message: { text: 'Produto atualizado com sucesso!', alert: 'info' } });
          this.timerMessage(3000);

        })
        .catch(e => console.log(e));
    }
  }

  delete = (id_produto) => {
    fetch(`${this.Url}/${id_produto}`, { method: 'DELETE' })
      .then(response => response.json())
      .then(rows => {
        const produtos = this.state.produtos.filter(produto => produto.id_produto !== id_produto);
        this.setState({ produtos, message: { text: 'Produto deletado com sucesso.', alert: 'danger' } });
        this.timerMessage(3000);
      })
      .catch(e => console.log(e));
  }

  timerMessage = (duration) => {
    setTimeout(() => {
      this.setState({ message: { text: '', alert: '' } })
    }, duration);
  }


  render() {
    return (
      <div>
        {
          this.state.message.text !== '' ? (
            <Alert color={this.state.message.alert} className="text-center"> {this.state.message.text} </Alert>
          ) : ''
        }

        <div className="row">
          <div className="col-md-6 my-3">
            <h2 className="font-weight-bold text-center"> Cadastro de Produtos </h2>
            <FormProduct produtoCreate={this.save} />
          </div>
          <div className="col-md-6 my-3">
            <h2 className="font-weight-bold text-center"> Lista de Produtos </h2>
            <ListProduct produtos={this.state.produtos} deleteProduct={this.delete} />
          </div>
        </div>
        <div className="text-center">
          <Link to="/logout" className="btn btn-outline-primary"> Log Out</Link>
        </div>
      </div>
    );
  }
}