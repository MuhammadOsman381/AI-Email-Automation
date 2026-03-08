import { Spinner } from './ui/spinner'

const Loading = ({ title, description }: { title: string, description: string }) => {
    return (
        <div>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs">
                <div className="flex flex-col items-center gap-4 bg-background/80 px-8 py-6 rounded-2xl shadow-xl border">
                    <Spinner className="size-8 animate-spin text-primary" />
                    <div className="text-center">
                        <p className="text-lg font-semibold">{title}</p>
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Loading