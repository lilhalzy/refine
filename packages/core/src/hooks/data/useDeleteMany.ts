import { useContext } from "react";
import { useQueryClient, useMutation, UseMutationResult } from "react-query";

import { DataContext } from "@contexts/data";
import {
    DeleteManyResponse,
    IDataContext,
    HttpError,
    BaseRecord,
} from "../../interfaces";
import { useNotification, useTranslate } from "@hooks";

type UseDeleteManyReturnType<T> = UseMutationResult<
    DeleteManyResponse<T>,
    unknown,
    {
        id: (string | number)[];
    },
    unknown
>;

export const useDeleteMany = <RecordType extends BaseRecord = BaseRecord>(
    resource: string,
): UseDeleteManyReturnType<RecordType> => {
    const { deleteMany } = useContext<IDataContext>(DataContext);
    const notification = useNotification();
    const translate = useTranslate();

    if (!resource) {
        throw new Error("'resource' is required for useDelete hook.");
    }

    const queryClient = useQueryClient();

    const queryResource = `resource/list/${resource}`;

    const mutation = useMutation(
        ({ id }: { id: (string | number)[] }) =>
            deleteMany<RecordType>(resource, id),
        {
            // Always refetch after error or success:
            onSettled: () => {
                queryClient.invalidateQueries(queryResource);
            },
            onSuccess: (_data, { id }) => {
                notification.success({
                    key: `${id}-${resource}-notification`,
                    message: translate(
                        "common:notifications.success",
                        "Success",
                    ),
                    description: translate(
                        "common:notifications.deleteSuccess",
                        { resource },
                        `Successfully deleted ${resource}`,
                    ),
                });
            },
            onError: (err: HttpError, { id }) => {
                notification.error({
                    key: `${id}-${resource}-notification`,
                    message: translate(
                        "common:notifications.error",
                        { statusCode: err.statusCode },
                        `Error (status code: ${err.statusCode})`,
                    ),
                    description: err.message,
                });
            },
        },
    );

    return mutation;
};
