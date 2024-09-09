use attribute_derive::FromAttr;
use manyhow::{manyhow, Emitter, ErrorMessage};
use proc_macro::TokenStream;
use quote::quote;
use syn::{Data, DeriveInput, Expr};

#[derive(FromAttr)]
#[attribute(ident = api_error)]
#[attribute(error(missing_field = "`{field}` was not specified"))]
struct ApiErrorAttribute {
    status_code: Expr,
}

#[manyhow]
#[proc_macro_derive(ApiError, attributes(api_error))]
pub fn derive_api_error(input: TokenStream, emitter: &mut Emitter) -> manyhow::Result<TokenStream> {
    let input: DeriveInput = syn::parse(input)?;

    let Data::Enum(data) = &input.data else {
        emitter.emit(ErrorMessage::call_site(
            "`ApiError` derive is only supported on enums",
        ));
        return Err(emitter.into_result().unwrap_err());
    };

    let struct_ident = &input.ident;
    let mut variants = vec![];

    if data.variants.is_empty() {
        return Ok((quote! {
            #[automatically_derived]
            impl crate::api::errors::ApiError for #struct_ident {
                fn status_code(&self) -> http::StatusCode {
                    http::StatusCode::INTERNAL_SERVER_ERROR
                }
            }
        })
        .into());
    }

    for variant in &data.variants {
        let ident = &variant.ident;

        let attribute = ApiErrorAttribute::from_attributes(&variant.attrs).unwrap();
        let status_code = &attribute.status_code;

        variants.push(quote! {
            #struct_ident::#ident => #status_code
        });
    }

    Ok((quote! {
        #[automatically_derived]
        impl crate::api::errors::ApiError for #struct_ident {
            fn status_code(&self) -> http::StatusCode {
                match self {
                    #(#variants,)*
                }
            }
        }
    })
    .into())
}
