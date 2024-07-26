use proc_macro::TokenStream;
use attribute_derive::FromAttr;
use proc_macro_error::{abort_call_site, proc_macro_error};
use quote::quote;
use syn::{Data, DeriveInput, Expr, parse_macro_input};

#[derive(FromAttr)]
#[attribute(ident = api_error)]
#[attribute(error(missing_field = "`{field}` was not specified"))]
struct ApiErrorAttribute {
    status_code: Expr
}

#[proc_macro_derive(ApiError, attributes(status_code))]
#[proc_macro_error]
pub fn derive_api_error(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let Data::Enum(data) = &input.data else {
        abort_call_site!("`ApiError` derive is only supported on enums");
    };

    let struct_ident = &input.ident;
    let mut variants = vec![];

    for variant in &data.variants {
        let ident = &variant.ident;

        let attribute = ApiErrorAttribute::from_attributes(&variant.attrs).unwrap();
        let status_code = &attribute.status_code;

        variants.push(quote! {
            #struct_ident::#ident => #status_code
        });
    }

    (quote! {
        impl crate::api::errors::ApiError for #struct_ident {
            fn status_code(&self) -> http::StatusCode {
                match self {
                    #(#variants,)*
                }
            }
        }
    }).into()
}
