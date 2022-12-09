import { ApolloCache, DefaultContext, DocumentNode, FetchResult, MutationFunctionOptions, MutationHookOptions, MutationTuple, OperationVariables, TypedDocumentNode, useMutation } from '@apollo/client'
import { useSession } from 'next-auth/react'

/** By default, useMutation doesn't foward an accesstoken to the API.
 * For all user-authenticated mutations, you can use this hook to automatically
 * inject the accessToken into the context (if it exists).
 *
 * It is best to use this hook over useMutation for anything that might have an evolving
 * auth requirement.
 */
export function useSecureMutation<TData = any, TVariables = OperationVariables, TContext = DefaultContext, TCache extends ApolloCache<any> = ApolloCache<any>> (mutation: DocumentNode | TypedDocumentNode<TData, TVariables>, options?: MutationHookOptions<TData, TVariables, TContext>): MutationTuple<TData, TVariables, TContext, TCache> {
  // contextual types
  type MutationOps = MutationFunctionOptions<TData, TVariables, TContext, TCache>
  type WrapperResult = Promise<FetchResult<TData, Record<string, any>, Record<string, any>>>

  const [mutate, res] = useMutation<TData, TVariables, TContext, TCache>(mutation, options)
  const session = useSession()

  async function wrapMutate (options?: MutationOps | undefined): WrapperResult {
    if (session.status === 'authenticated') {
      let context: any = ((options?.context) != null) ? options.context : {}
      const headers: Record<string, any> = context.headers != null ? context.headers : {}
      const accessToken = session?.data?.accessToken as string ?? ''

      context = {
        ...context,
        headers: {
          ...headers,
          authorization: `Bearer ${accessToken}`
        }
      }

      // Return authenticated mutate
      return await mutate({
        ...options,
        context
      })
    }

    // return standard mutate
    return await mutate(options)
  }

  return [wrapMutate, res]
}
