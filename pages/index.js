import React from 'react';
import { Heading, Page, TextStyle, Layout, EmptyState} from "@shopify/polaris";
import { ResourcePicker, TitleBar } from '@shopify/app-bridge-react';
import EditProduct from './editproduct';


// Sets the state for the resource picker
class Index extends React.Component {
  state = { 
    open: false,
    prod: null
  };

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps !== this.props || nextState !== this.state) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    return (
      <Page>
        <TitleBar
          primaryAction={{
            content: 'Select product',
            onAction: () => this.setState({ open: true }),
          }}
        />
        <ResourcePicker // Resource picker component
          resourceType="Product"
          showVariants={false}
          open={this.state.open}
          onSelection={(resources) => this.handleSelection(resources)}
          onCancel={() => this.setState({ open: false })}
          selectMultiple={false}
        />
        <Layout>
          {this.state.prod ? (
            <EditProduct 
              product={this.state.prod}
            />
          ) : 
          (
            <EmptyState
              heading="Choose a product to configure"

              action={{
                content: 'Select product',
                onAction: () => this.setState({ open: true }),
              }}
              image="https://596a-75-187-144-202.ngrok.io/public/logo.png"
            >
            <p>Window Blinds Store Product Configurator</p>
            </EmptyState>
          )
          }
        </Layout>
      </Page>
    );
  }
  handleSelection = (resources) => {
    this.setState({ 
      open: false,
      prod: resources.selection[0]
    });
  };
}

export default Index;