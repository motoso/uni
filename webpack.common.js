const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WextManifestWebpackPlugin = require("wext-manifest-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const targetBrowser = process.env.TARGET_BROWSER || 'chrome';

module.exports = {
    entry: {
        manifest: path.join(__dirname, "src/manifest.json"),
        popup: path.join(__dirname, "src/popup/index.tsx"),
        eventPage: path.join(__dirname, "src/eventPage.ts"),
        fanzaBooks: path.join(__dirname, "src/contentScript/FanzaBooks.tsx"),
        fanzaDoujin: path.join(__dirname, "src/contentScript/FanzaDoujin.tsx"),
        fanzaVideo: path.join(__dirname, "src/contentScript/FanzaVideo.tsx"),
        fanzaAnime: path.join(__dirname, "src/contentScript/FanzaAnime.tsx"),
        fc2ContentMarket: path.join(__dirname, "src/contentScript/Fc2ContentMarket.tsx"),
        dlsite: path.join(__dirname, "src/contentScript/DLsiteBooks.tsx"),
        dlsiteManiax: path.join(__dirname, "src/contentScript/DLsiteManiax.tsx"),
        toranoana: path.join(__dirname, "src/contentScript/Toranoana.tsx"),
        melonbooks: path.join(__dirname, "src/contentScript/Melonbooks.tsx"),
        amazon: path.join(__dirname, "src/contentScript/Amazon.tsx"),
        bookWalker: path.join(__dirname, "src/contentScript/BookWalker.tsx"),
        surugaya: path.join(__dirname, "src/contentScript/Surugaya.tsx"),
        DMMBasket: path.join(__dirname, "src/contentScript/DMMBasket.tsx"),
        DLsiteCart: path.join(__dirname, "src/contentScript/DLsiteCart.tsx"),
    },
    output: {
        path: path.join(__dirname, "dist", targetBrowser),
        filename: "js/[name].js"
    },
    module: {
        rules: [
            {
                type: 'javascript/auto',
                test: /manifest\.json$/,
                use: 'wext-manifest-loader',
                exclude: /node_modules/,
            },
            {
                exclude: /node_modules/,
                test: /\.tsx?$/,
                use: "ts-loader"
            },
            {
                exclude: /node_modules/,
                test: /\.scss$/,
                use: [
                    {
                        loader: "style-loader" // Creates style nodes from JS strings
                    },
                    {
                        loader: "css-loader" // Translates CSS into CommonJS
                    },
                    {
                        loader: "postcss-loader",
                    },
                    // webpackのloaderは逆順に評価されるのでまずsass-loaderを通す
                    // https://teratail.com/questions/162917
                    {
                        loader: "sass-loader" // Compiles Sass to CSS
                    },
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "src/popup/popup.template.html",
            filename: "popup.html",
            chunks: ["popup"],
            charset: "utf-8",
        }),
        new WextManifestWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "src/*.png",
                    to: "[name][ext]"
                }
            ]
        }),
    ],
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    }
};
