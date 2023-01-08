import {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import path from "path";
import fs from "fs";
import matter, { read } from "gray-matter";
import { ParsedUrlQuery } from "querystring";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

type Props = InferGetStaticPropsType<typeof getStaticProps>;
// typeof is extend with generic type

const SinglePage: NextPage<Props> = ({ post }) => {
  const { content, title } = post;
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-semibold text-2xl py-5">{title}</h1>
      <div className="prose pb-20">
        <MDXRemote {...content} />
      </div>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  // running inside server
  const dirPathToRead = path.join(process.cwd(), "posts");
  const dirs = fs.readdirSync(dirPathToRead);
  // read files from fs function

  const paths = dirs.map((filename) => {
    const filePathToRead = path.join(process.cwd(), "posts/" + filename);
    const fileContent = fs.readFileSync(filePathToRead, { encoding: "utf-8" });
    return { params: { postSlug: matter(fileContent).data.slug } };
  });
  // running inside server
  return {
    paths,
    fallback: "blocking",
  };
};

interface IStaticProps extends ParsedUrlQuery {
  postSlug: string;
}

type Post = {
  post: {
    title: string;
    content: MDXRemoteSerializeResult;
  };
};

export const getStaticProps: GetStaticProps<Post> = async (ctx) => {
  try {
    const { params } = ctx;
    const { postSlug } = params as IStaticProps;
    const filePathToRead = path.join(
      process.cwd(),
      "posts/" + postSlug + ".md"
    );
    const fileContent = fs.readFileSync(filePathToRead, { encoding: "utf-8" });
    const { content, data } = matter(fileContent);
    const source = await serialize(content, {
      mdxOptions: { development: false },
    });

    return {
      props: {
        post: {
          content: source,
          title: data.title,
        },
      },
    };
  } catch (err) {
    return {
      notFound: true,
    };
  }
};

export default SinglePage;
